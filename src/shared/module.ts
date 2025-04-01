export const GAME_CONSTANTS = {
	VERSION: "1.0.0",
	TITLE: "Lost in the Sauce",
	DEFAULT_GAME_TIME: 120,
	MAX_INGREDIENTS: 10,
	COLLECTION_RADIUS: 5,
	POINT_PER_INGREDIENT: 10,
	TRAP_DURATION: 2,
};

export function formatTime(seconds: number): string {
	const minutes = math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}
