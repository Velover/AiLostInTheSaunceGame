export const enum IngredientType {
	Tomato = "Tomato",
	Garlic = "Garlic",
	Basil = "Basil",
	Oregano = "Oregano",
	Pepper = "Pepper",
}

export interface Ingredient {
	id: string;
	type: IngredientType;
	position: Vector3;
	collected: boolean;
}

export enum ObstacleType {
	SaucePool = "SaucePool",
	Spill = "Spill",
	StickyFloor = "StickyFloor",
}

export interface Obstacle {
	id: string;
	type: ObstacleType;
	position: Vector3;
	size: Vector3;
}

export interface Level {
	id: number;
	name: string;
	ingredients: Ingredient[];
	obstacles: Obstacle[];
	startPosition: Vector3;
	endPosition: Vector3;
	timeLimit: number;
}

export interface PlayerData {
	name: string;
	position: Vector3;
	ingredientsCollected: string[];
	isTrapped: boolean;
	score: number;
}
