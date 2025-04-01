import { Flamework, Modding, OnInit, OnStart, Service } from "@flamework/core";
import { HttpService, Players, Workspace } from "@rbxts/services";
import { Events } from "server/network";
import { GameState, LeaderboardEntry } from "shared/network";
import {
	Ingredient,
	IngredientType,
	Level,
	Obstacle,
	ObstacleType,
	PlayerData,
} from "shared/types/GameTypes";

// Create BindableEvent for server-side communication
export interface GameBindableEvents {
	gameStarted: BindableEvent;
	gameEnded: BindableEvent;
	dangerAlert: BindableEvent; // Add dangerAlert event
}

@Service({})
export class GameService implements OnStart, OnInit {
	private players = new Map<Player, PlayerData>();
	private ingredients = new Map<string, Ingredient>();
	private currentLevel: Level | undefined;
	private gameActive = false;
	private gameTimer: number = 0;
	private ingredientsFolder: Folder | undefined;
	private obstaclesFolder: Folder | undefined;

	// Bindable events for other services to listen to
	public readonly bindings: GameBindableEvents = {
		gameStarted: new Instance("BindableEvent"),
		gameEnded: new Instance("BindableEvent"),
		dangerAlert: new Instance("BindableEvent"), // Add the new BindableEvent instance
	};

	onInit() {
		// Create folders for organizing game objects
		this.ingredientsFolder = new Instance("Folder");
		this.ingredientsFolder.Name = "Ingredients";
		this.ingredientsFolder.Parent = Workspace;

		this.obstaclesFolder = new Instance("Folder");
		this.obstaclesFolder.Name = "Obstacles";
		this.obstaclesFolder.Parent = Workspace;

		// Initialize default level
		this.currentLevel = this.createLevel(1);

		Events.gameStart.connect(() => this.startGame());
		Events.playerMoved.connect((player, position) => this.handlePlayerMove(player, position));
		Events.collectIngredient.connect((player, id) => this.collectIngredient(player, id));
		Events.playerFreed.connect((player) => this.handlePlayerFreed(player));

		Players.PlayerAdded.Connect((player) => this.handlePlayerJoin(player));
		Players.PlayerRemoving.Connect((player) => this.handlePlayerLeave(player));
	}

	onStart() {
		// Start a game loop
		task.spawn(() => {
			while (true) {
				if (this.gameActive) {
					this.gameTimer -= 1;
					this.broadcastGameState();

					if (this.gameTimer <= 0) {
						this.endGame(false); // Time ran out - no victory
					}
				}
				task.wait(1);
			}
		});
	}

	private handlePlayerJoin(player: Player) {
		const playerData: PlayerData = {
			name: player.Name,
			position: this.currentLevel?.startPosition || new Vector3(0, 5, 0),
			ingredientsCollected: [],
			isTrapped: false,
			score: 0,
		};

		this.players.set(player, playerData);
		this.updateLeaderboard();
	}

	private handlePlayerLeave(player: Player) {
		this.players.delete(player);
		this.updateLeaderboard();
	}

	private handlePlayerFreed(player: Player) {
		const playerData = this.players.get(player);
		if (playerData) {
			playerData.isTrapped = false;
		}
	}

	private handlePlayerMove(player: Player, position: Vector3) {
		const playerData = this.players.get(player);
		if (!playerData || playerData.isTrapped) return; // Don't check if already trapped

		playerData.position = position;

		// Check collisions with obstacles
		if (this.currentLevel) {
			for (const obstacle of this.currentLevel.obstacles) {
				if (this.isPositionInBox(position, obstacle.position, obstacle.size)) {
					playerData.isTrapped = true;
					Events.playerTrapped.broadcast(player.Name);
					return; // Exit after trapping
				}
			}
		}

		// Check collisions with danger objects
		const dangerFolder = Workspace.FindFirstChild("Dangers");
		if (dangerFolder) {
			for (const child of dangerFolder.GetChildren()) {
				const isTrap = child.GetAttribute("traps") as boolean;

				if (isTrap && child.IsA("BasePart")) {
					// Use a larger hit radius for dangers
					if (
						this.isPositionInBox(
							position,
							child.Position,
							child.Size.add(new Vector3(1, 1, 1)), // Add a buffer
						)
					) {
						playerData.isTrapped = true;
						Events.playerTrapped.broadcast(player.Name);
						return;
					}
				}
			}
		}
	}

	private collectIngredient(player: Player, id: string) {
		const playerData = this.players.get(player);
		const ingredient = this.ingredients.get(id);

		if (!playerData || !ingredient || ingredient.collected) return;

		ingredient.collected = true;
		playerData.ingredientsCollected.push(id);
		playerData.score += 10;

		Events.ingredientCollected.broadcast(id, player.Name);
		this.updateLeaderboard();

		// Remove the physical representation
		const ingredientPart = this.ingredientsFolder?.FindFirstChild(
			`Ingredient_${ingredient.type}_${id}`,
		);
		if (ingredientPart) {
			ingredientPart.Destroy();
		}
	}

	private startGame() {
		// Clear any previous game state completely
		this.clearGameState();

		this.gameActive = true;
		this.gameTimer = this.currentLevel?.timeLimit || 60;
		this.spawnIngredients();
		this.spawnObstacles();

		// Broadcast via bindable event for other services
		this.bindings.gameStarted.Fire();

		// Broadcast via remote event for clients
		Events.gameStarted.broadcast();

		this.broadcastGameState();
	}

	private endGame(victory: boolean = false) {
		if (!this.gameActive) return; // Prevent multiple end game calls

		this.gameActive = false;

		// Save collected ingredients count before resetting
		const ingredientsCollected = [...this.ingredients]
			.map((i) => i[1])
			.filter((i) => i.collected)
			.size();
		const totalIngredients = this.ingredients.size();

		// Reset player positions
		for (const [player, data] of this.players) {
			data.isTrapped = false;
			data.position = this.currentLevel?.startPosition || new Vector3(0, 5, 0);
		}

		// Clear ingredients and obstacles
		this.ingredients.clear();
		this.clearPhysicalObjects();

		// Fire bindable event first (for other services)
		this.bindings.gameEnded.Fire(victory);

		// Broadcast game over with victory status to clients
		Events.gameOver.broadcast(victory);

		// Final state update - keep the collected count for proper display
		const gameState: GameState = {
			timeRemaining: 0,
			ingredientsCollected: ingredientsCollected, // Use saved value instead of 0
			totalIngredients: totalIngredients, // Use saved value instead of 0
			gameOver: true,
			victory: victory,
		};

		Events.updateGameState.broadcast(gameState);
	}

	private clearGameState() {
		// Clear physical objects if they exist from previous game
		this.clearPhysicalObjects();

		// Clear ingredients map
		this.ingredients.clear();

		// Reset level if needed
		if (!this.currentLevel) {
			this.currentLevel = this.createLevel(1);
		}
	}

	private clearPhysicalObjects() {
		// Clear ingredients folder
		if (this.ingredientsFolder) {
			for (const child of this.ingredientsFolder.GetChildren()) {
				child.Destroy();
			}
		}

		// Clear obstacles folder
		if (this.obstaclesFolder) {
			for (const child of this.obstaclesFolder.GetChildren()) {
				child.Destroy();
			}
		}
	}

	private spawnIngredients() {
		if (!this.currentLevel || !this.ingredientsFolder) return;

		this.ingredients.clear();

		for (const ingredient of this.currentLevel.ingredients) {
			this.ingredients.set(ingredient.id, ingredient);

			// Create physical representation of the ingredient
			const part = new Instance("Part");
			part.Name = `Ingredient_${ingredient.type}_${ingredient.id}`;
			part.Position = ingredient.position;
			part.Size = new Vector3(1, 1, 1);
			part.Anchored = true;
			part.CanCollide = false;
			part.SetAttribute("id", ingredient.id);
			part.SetAttribute("type", ingredient.type);
			part.SetAttribute("collected", false);

			// Set tag for component system
			part.SetAttribute("Tag", "Ingredient");

			part.Parent = this.ingredientsFolder;
		}
	}

	private spawnObstacles() {
		if (!this.currentLevel || !this.obstaclesFolder) return;

		for (const obstacle of this.currentLevel.obstacles) {
			// Create physical representation of the obstacle
			const part = new Instance("Part");
			part.Name = `Obstacle_${obstacle.type}_${obstacle.id}`;
			part.Position = obstacle.position;
			part.Size = obstacle.size;
			part.Anchored = true;
			part.CanCollide = true;
			part.Transparency = 0.5;
			part.SetAttribute("id", obstacle.id);
			part.SetAttribute("type", obstacle.type);

			// Set tag for component system
			part.SetAttribute("Tag", "Obstacle");

			// Different colors for different obstacle types
			switch (obstacle.type) {
				case ObstacleType.SaucePool:
					part.BrickColor = new BrickColor("Really red");
					break;
				case ObstacleType.Spill:
					part.BrickColor = new BrickColor("Bright orange");
					break;
				case ObstacleType.StickyFloor:
					part.BrickColor = new BrickColor("Brown");
					break;
			}

			part.Parent = this.obstaclesFolder;
		}
	}

	private createLevel(levelId: number): Level {
		// Create a simple level
		return {
			id: levelId,
			name: "Saucy Maze",
			ingredients: this.generateIngredients(10),
			obstacles: this.generateObstacles(5),
			startPosition: new Vector3(0, 5, 0),
			endPosition: new Vector3(50, 5, 50),
			timeLimit: 120,
		};
	}

	private generateIngredients(count: number): Ingredient[] {
		const ingredients: Ingredient[] = [];
		const ingredientTypes = Modding.inspect<IngredientType[]>();

		for (let i = 0; i < count; i++) {
			const x = math.random(-50, 50);
			const z = math.random(-50, 50);

			ingredients.push({
				id: HttpService.GenerateGUID(false),
				type: ingredientTypes[math.floor(math.random() * ingredientTypes.size())] as IngredientType,
				position: new Vector3(x, 5, z),
				collected: false,
			});
		}

		return ingredients;
	}

	private generateObstacles(count: number): Obstacle[] {
		const obstacles: Obstacle[] = [];
		const obstacleTypes = Modding.inspect<ObstacleType[]>();

		for (let i = 0; i < count; i++) {
			const x = math.random(-40, 40);
			const z = math.random(-40, 40);

			obstacles.push({
				id: HttpService.GenerateGUID(false),
				type: obstacleTypes[math.floor(math.random() * obstacleTypes.size())] as ObstacleType,
				position: new Vector3(x, 0, z),
				size: new Vector3(5, 1, 5),
			});
		}

		return obstacles;
	}

	private broadcastGameState() {
		const ingredientsCollected = [...this.ingredients]
			.map((i) => i[1])
			.filter((i) => i.collected)
			.size();

		const totalIngredients = this.ingredients.size();

		// Check if all ingredients are collected
		if (ingredientsCollected === totalIngredients && totalIngredients > 0 && this.gameActive) {
			// End game with victory
			this.endGame(true);
			return;
		}

		const gameState: GameState = {
			timeRemaining: this.gameTimer,
			ingredientsCollected: ingredientsCollected,
			totalIngredients: totalIngredients,
		};

		Events.updateGameState.broadcast(gameState);
	}

	private updateLeaderboard() {
		const leaderboard: LeaderboardEntry[] = [];

		for (const [player, data] of this.players) {
			leaderboard.push({
				playerName: player.Name,
				score: data.score,
			});
		}

		// Sort by score, descending (roblox-ts implementation uses boolean instead of number)
		leaderboard.sort((a, b) => a.score > b.score);

		Events.updateLeaderboard.broadcast(leaderboard);
	}

	private isPositionInBox(position: Vector3, boxPosition: Vector3, boxSize: Vector3): boolean {
		return (
			position.X >= boxPosition.X - boxSize.X / 2 &&
			position.X <= boxPosition.X + boxSize.X / 2 &&
			position.Z >= boxPosition.Z - boxSize.Z / 2 &&
			position.Z <= boxPosition.Z + boxSize.Z / 2
		);
	}

	// Add a method to broadcast danger alerts to clients
	public broadcastDangerAlert(position: Vector3, dangerType: string): void {
		// Use the BindableEvent for server-side communication
		this.bindings.dangerAlert.Fire(position, dangerType);

		// Also send to clients
		Events.dangerAlert.broadcast(position, dangerType);
	}
}
