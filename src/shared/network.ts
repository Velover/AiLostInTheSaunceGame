import { Networking } from "@flamework/networking";

interface ClientToServerEvents {
	playerMoved: (position: Vector3) => void;
	collectIngredient: (id: string) => void;
	gameStart: () => void;
	playerFreed: () => void; // Added for trap recovery
}

interface ServerToClientEvents {
	updateGameState: (state: GameState) => void;
	ingredientCollected: (id: string, playerName: string) => void;
	playerTrapped: (playerName: string) => void;
	updateLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
	gameStarted: () => void;
	gameOver: (victory: boolean) => void; // Added for game completion
	dangerAlert: (position: Vector3, type: string) => void; // Added for danger notification
}

interface ClientToServerFunctions {
	getGameState: () => GameState;
}

interface ServerToClientFunctions {
	spawnIngredient: (position: Vector3) => string;
}

export interface GameState {
	timeRemaining: number;
	ingredientsCollected: number;
	totalIngredients: number;
	playerPosition?: Vector3;
	gameOver?: boolean; // Add game over state
	victory?: boolean; // Add victory state
}

export interface LeaderboardEntry {
	playerName: string;
	score: number;
}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalFunctions = Networking.createFunction<
	ClientToServerFunctions,
	ServerToClientFunctions
>();
