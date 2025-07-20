// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title FlappyCryptoScore
 * @dev Smart contract for storing Flippy Flappy Crypto game scores on BASE network
 */
contract FlappyCryptoScore {
    // Struct to store score data
    struct Score {
        uint256 score;
        uint256 ethCollected;
        uint256 distance; // Distance traveled in pixels
        uint256 timestamp;
    }
    
    // Mapping of player address to their scores
    mapping(address => Score[]) private playerScores;
    
    // Top scores array
    Score[] private topScores;
    address[] private topScoreAddresses;
    uint256 private constant MAX_TOP_SCORES = 10;
    
    // Events
    event ScoreSaved(address indexed player, uint256 score, uint256 ethCollected, uint256 distance, uint256 timestamp);
    event NewTopScore(address indexed player, uint256 score, uint256 ethCollected, uint256 distance, uint256 timestamp);
    
    /**
     * @dev Save a new score for the player
     * @param _score The player's score
     * @param _ethCollected The amount of ETH collected in the game
     * @param _distance The distance traveled in pixels
     */
    function saveScore(uint256 _score, uint256 _ethCollected, uint256 _distance) external {
        // Create new score
        Score memory newScore = Score({
            score: _score,
            ethCollected: _ethCollected,
            distance: _distance,
            timestamp: block.timestamp
        });
        
        // Add to player's scores
        playerScores[msg.sender].push(newScore);
        
        // Check if it's a top score
        _checkAndUpdateTopScores(msg.sender, newScore);
        
        // Emit event
        emit ScoreSaved(msg.sender, _score, _ethCollected, _distance, block.timestamp);
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
     * @return The player's best score, ETH collected, distance, and timestamp
     */
    function getPlayerBestScore(address _player) external view returns (uint256, uint256, uint256, uint256) {
        Score[] memory scores = playerScores[_player];
        
        if (scores.length == 0) {
            return (0, 0, 0, 0);
        }
        
        uint256 bestScore = 0;
        uint256 bestEthCollected = 0;
        uint256 bestDistance = 0;
        uint256 timestamp = 0;
        
        for (uint256 i = 0; i < scores.length; i++) {
            if (scores[i].score > bestScore) {
                bestScore = scores[i].score;
                bestEthCollected = scores[i].ethCollected;
                bestDistance = scores[i].distance;
                timestamp = scores[i].timestamp;
            }
        }
        
        return (bestScore, bestEthCollected, bestDistance, timestamp);
    }
    
    /**
     * @dev Get the top scores
     * @return Arrays of top scores and corresponding addresses
     */
    function getTopScores() external view returns (Score[] memory, address[] memory) {
        return (topScores, topScoreAddresses);
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
            emit NewTopScore(_player, _score.score, _score.ethCollected, _score.distance, _score.timestamp);
            
            // Sort the array if needed
            if (topScores.length > 1) {
                _sortTopScores();
            }
            return;
        }
        
        // Check if the new score is higher than the lowest top score
        if (_score.score > topScores[topScores.length - 1].score) {
            // Replace the lowest score
            topScores[topScores.length - 1] = _score;
            topScoreAddresses[topScores.length - 1] = _player;
            emit NewTopScore(_player, _score.score, _score.ethCollected, _score.distance, _score.timestamp);
            
            // Re-sort the array
            _sortTopScores();
        }
    }
    
    /**
     * @dev Sort the top scores array (simple bubble sort)
     */
    function _sortTopScores() private {
        for (uint256 i = 0; i < topScores.length - 1; i++) {
            for (uint256 j = 0; j < topScores.length - i - 1; j++) {
                if (topScores[j].score < topScores[j + 1].score) {
                    // Swap scores
                    Score memory tempScore = topScores[j];
                    topScores[j] = topScores[j + 1];
                    topScores[j + 1] = tempScore;
                    
                    // Swap addresses
                    address tempAddress = topScoreAddresses[j];
                    topScoreAddresses[j] = topScoreAddresses[j + 1];
                    topScoreAddresses[j + 1] = tempAddress;
                }
            }
        }
    }
} 
