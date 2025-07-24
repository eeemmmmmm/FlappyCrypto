// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title FlappyCryptoScore
 * @dev Smart contract for storing Flippy Flappy Crypto game scores on BASE network
 * with achievements, seasonal leaderboards and NFT badges
 */
contract FlappyCryptoScore {
    // Contract owner
    address private owner;
    
    // Struct to store score data
    struct Score {
        uint256 score;
        uint256 ethCollected;
        uint256 distance; // Distance traveled in pixels
        uint256 timestamp;
        uint256 season;   // Season ID when score was recorded
    }
    
    // Achievement struct
    struct Achievement {
        string name;
        string description;
        uint256 threshold;
        uint8 achievementType; // 0: score, 1: ethCollected, 2: distance, 3: games played
    }
    
    // Season struct
    struct Season {
        string name;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }
    
    // NFT Badge struct
    struct Badge {
        string name;
        string description;
        string imageURI;
        uint256 season;
        uint8 rank; // 1: gold, 2: silver, 3: bronze
    }
    
    // Mapping of player address to their scores
    mapping(address => Score[]) private playerScores;
    
    // Top scores array (all-time)
    Score[] private topScores;
    address[] private topScoreAddresses;
    uint256 private constant MAX_TOP_SCORES = 10;
    
    // Seasonal leaderboards
    mapping(uint256 => Score[]) private seasonalTopScores;
    mapping(uint256 => address[]) private seasonalTopAddresses;
    
    // Achievements
    Achievement[] public achievements;
    mapping(address => mapping(uint256 => bool)) public playerAchievements; // player => achievementId => unlocked
    
    // Seasons
    Season[] public seasons;
    uint256 public currentSeason = 0;
    
    // Badges
    mapping(address => Badge[]) public playerBadges;
    mapping(uint256 => bool) private seasonBadgesAwarded;
    
    // Player stats for achievements
    mapping(address => uint256) private gamesPlayed;
    
    // Events
    event ScoreSaved(address indexed player, uint256 score, uint256 ethCollected, uint256 distance, uint256 timestamp, uint256 season);
    event NewTopScore(address indexed player, uint256 score, uint256 ethCollected, uint256 distance, uint256 timestamp, uint256 season);
    event AchievementUnlocked(address indexed player, uint256 indexed achievementId, string name);
    event BadgeAwarded(address indexed player, string name, uint256 season, uint8 rank);
    event SeasonCreated(uint256 indexed seasonId, string name, uint256 startTime, uint256 endTime);
    event SeasonEnded(uint256 indexed seasonId, string name);
    
    /**
     * @dev Constructor to set up initial achievements and the first season
     */
    constructor() {
        owner = msg.sender;
        
        // Add initial achievements
        achievements.push(Achievement("Rookie", "Score 10 points", 10, 0));
        achievements.push(Achievement("Pro Player", "Score 50 points", 50, 0));
        achievements.push(Achievement("Master", "Score 100 points", 100, 0));
        achievements.push(Achievement("Crypto Miner", "Collect 20 ETH", 20, 1));
        achievements.push(Achievement("ETH Whale", "Collect 50 ETH", 50, 1));
        achievements.push(Achievement("Marathon Runner", "Travel 5000 pixels", 5000, 2));
        achievements.push(Achievement("Dedicated Player", "Play 10 games", 10, 3));
        
        // Start the first season
        _startNewSeason("Season 1", block.timestamp, block.timestamp + 90 days);
    }
    
    /**
     * @dev Modifier to restrict function access to contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Save a new score for the player
     * @param _score The player's score
     * @param _ethCollected The amount of ETH collected in the game
     * @param _distance The distance traveled in pixels
     */
    function saveScore(uint256 _score, uint256 _ethCollected, uint256 _distance) external {
        // Ensure there's an active season
        require(currentSeason < seasons.length && seasons[currentSeason].active, "No active season");
        
        // Create new score with current season
        Score memory newScore = Score({
            score: _score,
            ethCollected: _ethCollected,
            distance: _distance,
            timestamp: block.timestamp,
            season: currentSeason
        });
        
        // Add to player's scores
        playerScores[msg.sender].push(newScore);
        
        // Increment games played
        gamesPlayed[msg.sender]++;
        
        // Check for achievements
        _checkAchievements(msg.sender, _score, _ethCollected, _distance);
        
        // Check if it's a top score (all-time)
        _checkAndUpdateTopScores(msg.sender, newScore);
        
        // Check if it's a top score for the current season
        _checkAndUpdateSeasonalScores(msg.sender, newScore, currentSeason);
        
        // Emit event
        emit ScoreSaved(msg.sender, _score, _ethCollected, _distance, block.timestamp, currentSeason);
    }
    
    /**
     * @dev Get all scores for a player
     * @param _player The player's address
     * @return Array of scores
     */
    function getPlayerScores(address _player) external view returns (Score[] memory) {
        return playerScores[_player];
    }
    
    /**
     * @dev Get the best score for a player
     * @param _player The player's address
     * @return The player's best score, ETH collected, distance, timestamp, and season
     */
    function getPlayerBestScore(address _player) external view returns (uint256, uint256, uint256, uint256, uint256) {
        Score[] memory scores = playerScores[_player];
        
        if (scores.length == 0) {
            return (0, 0, 0, 0, 0);
        }
        
        uint256 bestScore = 0;
        uint256 bestEthCollected = 0;
        uint256 bestDistance = 0;
        uint256 timestamp = 0;
        uint256 season = 0;
        
        for (uint256 i = 0; i < scores.length; i++) {
            if (scores[i].score > bestScore) {
                bestScore = scores[i].score;
                bestEthCollected = scores[i].ethCollected;
                bestDistance = scores[i].distance;
                timestamp = scores[i].timestamp;
                season = scores[i].season;
            }
        }
        
        return (bestScore, bestEthCollected, bestDistance, timestamp, season);
    }
    
    /**
     * @dev Get the top scores (all-time)
     * @return Arrays of top scores and corresponding addresses
     */
    function getTopScores() external view returns (Score[] memory, address[] memory) {
        return (topScores, topScoreAddresses);
    }
    
    /**
     * @dev Get the top scores for a specific season
     * @param _seasonId The season ID
     * @return Arrays of top scores and corresponding addresses for that season
     */
    function getSeasonalTopScores(uint256 _seasonId) external view returns (Score[] memory, address[] memory) {
        require(_seasonId < seasons.length, "Invalid season ID");
        return (seasonalTopScores[_seasonId], seasonalTopAddresses[_seasonId]);
    }
    
    /**
     * @dev Get all achievements for a player
     * @param _player The player's address
     * @return Array of achievement IDs that the player has unlocked
     */
    function getPlayerAchievements(address _player) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First, count unlocked achievements
        for (uint256 i = 0; i < achievements.length; i++) {
            if (playerAchievements[_player][i]) {
                count++;
            }
        }
        
        // Create array of appropriate size
        uint256[] memory unlockedAchievements = new uint256[](count);
        
        // Fill the array
        uint256 index = 0;
        for (uint256 i = 0; i < achievements.length; i++) {
            if (playerAchievements[_player][i]) {
                unlockedAchievements[index] = i;
                index++;
            }
        }
        
        return unlockedAchievements;
    }
    
    /**
     * @dev Get all badges for a player
     * @param _player The player's address
     * @return Array of badges that the player has earned
     */
    function getPlayerBadges(address _player) external view returns (Badge[] memory) {
        return playerBadges[_player];
    }
    
    /**
     * @dev Get information about all seasons
     * @return Array of all seasons
     */
    function getAllSeasons() external view returns (Season[] memory) {
        return seasons;
    }
    
    /**
     * @dev Get information about the current season
     * @return The current season
     */
    function getCurrentSeason() external view returns (Season memory) {
        require(currentSeason < seasons.length, "No seasons exist");
        return seasons[currentSeason];
    }
    
    /**
     * @dev Start a new season (only owner)
     * @param _name The name of the new season
     * @param _startTime The start timestamp of the season
     * @param _endTime The end timestamp of the season
     */
    function startNewSeason(string calldata _name, uint256 _startTime, uint256 _endTime) external onlyOwner {
        // End the current season if it exists and is active
        if (currentSeason < seasons.length && seasons[currentSeason].active) {
            _endSeason(currentSeason);
        }
        
        _startNewSeason(_name, _startTime, _endTime);
    }
    
    /**
     * @dev End the current season and award badges (only owner)
     */
    function endCurrentSeason() external onlyOwner {
        require(currentSeason < seasons.length && seasons[currentSeason].active, "No active season to end");
        _endSeason(currentSeason);
    }
    
    /**
     * @dev Add a new achievement (only owner)
     * @param _name The name of the achievement
     * @param _description The description of the achievement
     * @param _threshold The threshold value to unlock the achievement
     * @param _type The type of achievement (0: score, 1: ethCollected, 2: distance, 3: games played)
     */
    function addAchievement(string calldata _name, string calldata _description, uint256 _threshold, uint8 _type) external onlyOwner {
        require(_type <= 3, "Invalid achievement type");
        achievements.push(Achievement(_name, _description, _threshold, _type));
    }
    
    /**
     * @dev Internal function to start a new season
     */
    function _startNewSeason(string memory _name, uint256 _startTime, uint256 _endTime) private {
        require(_startTime < _endTime, "End time must be after start time");
        
        seasons.push(Season({
            name: _name,
            startTime: _startTime,
            endTime: _endTime,
            active: true
        }));
        
        currentSeason = seasons.length - 1;
        
        emit SeasonCreated(currentSeason, _name, _startTime, _endTime);
    }
    
    /**
     * @dev Internal function to end a season and award badges
     */
    function _endSeason(uint256 _seasonId) private {
        require(_seasonId < seasons.length, "Invalid season ID");
        require(seasons[_seasonId].active, "Season already ended");
        
        // Mark season as inactive
        seasons[_seasonId].active = false;
        
        // Award badges if not already awarded
        if (!seasonBadgesAwarded[_seasonId]) {
            _awardSeasonalBadges(_seasonId);
            seasonBadgesAwarded[_seasonId] = true;
        }
        
        emit SeasonEnded(_seasonId, seasons[_seasonId].name);
    }
    
    /**
     * @dev Award badges to top players of a season
     */
    function _awardSeasonalBadges(uint256 _seasonId) private {
        address[] memory topPlayers = seasonalTopAddresses[_seasonId];
        
        // Need at least one player to award badges
        if (topPlayers.length == 0) return;
        
        // Season name for badges
        string memory seasonName = seasons[_seasonId].name;
        
        // Gold badge for 1st place
        if (topPlayers.length >= 1) {
            Badge memory goldBadge = Badge({
                name: string(abi.encodePacked("Gold - ", seasonName)),
                description: "1st place in seasonal leaderboard",
                imageURI: "ipfs://gold_badge_uri",
                season: _seasonId,
                rank: 1
            });
            
            playerBadges[topPlayers[0]].push(goldBadge);
            emit BadgeAwarded(topPlayers[0], goldBadge.name, _seasonId, 1);
        }
        
        // Silver badge for 2nd place
        if (topPlayers.length >= 2) {
            Badge memory silverBadge = Badge({
                name: string(abi.encodePacked("Silver - ", seasonName)),
                description: "2nd place in seasonal leaderboard",
                imageURI: "ipfs://silver_badge_uri",
                season: _seasonId,
                rank: 2
            });
            
            playerBadges[topPlayers[1]].push(silverBadge);
            emit BadgeAwarded(topPlayers[1], silverBadge.name, _seasonId, 2);
        }
        
        // Bronze badge for 3rd place
        if (topPlayers.length >= 3) {
            Badge memory bronzeBadge = Badge({
                name: string(abi.encodePacked("Bronze - ", seasonName)),
                description: "3rd place in seasonal leaderboard",
                imageURI: "ipfs://bronze_badge_uri",
                season: _seasonId,
                rank: 3
            });
            
            playerBadges[topPlayers[2]].push(bronzeBadge);
            emit BadgeAwarded(topPlayers[2], bronzeBadge.name, _seasonId, 3);
        }
    }
    
    /**
     * @dev Check if a player has unlocked any achievements
     */
    function _checkAchievements(address _player, uint256 _score, uint256 _ethCollected, uint256 _distance) private {
        for (uint256 i = 0; i < achievements.length; i++) {
            // Skip if already unlocked
            if (playerAchievements[_player][i]) continue;
            
            bool unlocked = false;
            
            // Check based on achievement type
            if (achievements[i].achievementType == 0) {
                // Score achievement
                unlocked = _score >= achievements[i].threshold;
            } else if (achievements[i].achievementType == 1) {
                // ETH collected achievement
                unlocked = _ethCollected >= achievements[i].threshold;
            } else if (achievements[i].achievementType == 2) {
                // Distance achievement
                unlocked = _distance >= achievements[i].threshold;
            } else if (achievements[i].achievementType == 3) {
                // Games played achievement
                unlocked = gamesPlayed[_player] >= achievements[i].threshold;
            }
            
            if (unlocked) {
                playerAchievements[_player][i] = true;
                emit AchievementUnlocked(_player, i, achievements[i].name);
            }
        }
    }
    
    /**
     * @dev Check if a score is a top score and update the top scores array
     * @param _player The player's address
     * @param _score The score to check
     */
    function _checkAndUpdateTopScores(address _player, Score memory _score) private {
        // If we don't have MAX_TOP_SCORES yet, just add it
        if (topScores.length < MAX_TOP_SCORES) {
            topScores.push(_score);
            topScoreAddresses.push(_player);
            emit NewTopScore(_player, _score.score, _score.ethCollected, _score.distance, _score.timestamp, _score.season);
            
            // Sort the array if needed
            if (topScores.length > 1) {
                _sortTopScores(topScores, topScoreAddresses);
            }
            return;
        }
        
        // Check if the new score is higher than the lowest top score
        if (_score.score > topScores[topScores.length - 1].score) {
            // Replace the lowest score
            topScores[topScores.length - 1] = _score;
            topScoreAddresses[topScores.length - 1] = _player;
            emit NewTopScore(_player, _score.score, _score.ethCollected, _score.distance, _score.timestamp, _score.season);
            
            // Re-sort the array
            _sortTopScores(topScores, topScoreAddresses);
        }
    }
    
    /**
     * @dev Check if a score is a seasonal top score and update the seasonal top scores array
     */
    function _checkAndUpdateSeasonalScores(address _player, Score memory _score, uint256 _seasonId) private {
        // Initialize arrays if they don't exist
        if (seasonalTopScores[_seasonId].length == 0) {
            // Fix: Don't try to copy memory array to storage
            // Instead, we'll just continue and the array will be initialized when we push to it
        }
        
        // If we don't have MAX_TOP_SCORES yet, just add it
        if (seasonalTopScores[_seasonId].length < MAX_TOP_SCORES) {
            seasonalTopScores[_seasonId].push(_score);
            seasonalTopAddresses[_seasonId].push(_player);
            
            // Sort the array if needed
            if (seasonalTopScores[_seasonId].length > 1) {
                _sortTopScores(seasonalTopScores[_seasonId], seasonalTopAddresses[_seasonId]);
            }
            return;
        }
        
        // Check if the new score is higher than the lowest top score
        if (_score.score > seasonalTopScores[_seasonId][seasonalTopScores[_seasonId].length - 1].score) {
            // Replace the lowest score
            seasonalTopScores[_seasonId][seasonalTopScores[_seasonId].length - 1] = _score;
            seasonalTopAddresses[_seasonId][seasonalTopScores[_seasonId].length - 1] = _player;
            
            // Re-sort the array
            _sortTopScores(seasonalTopScores[_seasonId], seasonalTopAddresses[_seasonId]);
        }
    }
    
    /**
     * @dev Sort the scores array (simple bubble sort)
     */
    function _sortTopScores(Score[] storage scores, address[] storage addresses) private {
        for (uint256 i = 0; i < scores.length - 1; i++) {
            for (uint256 j = 0; j < scores.length - i - 1; j++) {
                if (scores[j].score < scores[j + 1].score) {
                    // Swap scores
                    Score memory tempScore = scores[j];
                    scores[j] = scores[j + 1];
                    scores[j + 1] = tempScore;
                    
                    // Swap addresses
                    address tempAddress = addresses[j];
                    addresses[j] = addresses[j + 1];
                    addresses[j + 1] = tempAddress;
                }
            }
        }
    }
} 
