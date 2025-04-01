import { Networking } from "@flamework/networking";

interface ClientToServerEvents {
	playerMoved: (position: Vector3) => void;
	collectIngredient: (id: string) => void;
	gameStart: () => void;
}

interface ServerToClientEvents {
	updateGameState: (state: GameState) => void;
	ingredientCollected: (id: string, playerName: string) => void;
	playerTrapped: (playerName: string) => void;
	updateLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
	gameStarted: () => void; // Added event for game start notification
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
