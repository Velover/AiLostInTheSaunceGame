import { OnInit, OnStart, Service } from "@flamework/core";
import { HttpService, Players, RunService, Workspace } from "@rbxts/services";
import { GameService } from "./GameService";

interface SauceBall {
	id: string;
	part: Part;
	target?: Player;
	speed: number;
	lastTargetChange: number;
	active: boolean;
}

interface ExpandingPuddle {
	id: string;
	part: Part;
	startSize: Vector3;
	maxSize: Vector3;
	expandSpeed: number;
	contractSpeed: number;
	expanding: boolean;
	timer: number;
}

@Service({})
export class DangerService implements OnStart, OnInit {
	private sauceBalls: SauceBall[] = [];
	private expandingPuddles: ExpandingPuddle[] = [];
	private dangerFolder: Folder | undefined;
	private gameActive = false;
	private MAX_SAUCE_BALLS = 3;
	private MAX_EXPANDING_PUDDLES = 5;

	constructor(private gameService: GameService) {}

	onInit() {
		// Create folder for danger objects
		this.dangerFolder = new Instance("Folder");
		this.dangerFolder.Name = "Dangers";
		this.dangerFolder.Parent = Workspace;

		// Use bindable events from GameService instead of remote events
		this.gameService.bindings.gameStarted.Event.Connect(() => {
			this.gameActive = true;
			this.spawnInitialDangers();
		});

		this.gameService.bindings.gameEnded.Event.Connect(() => {
			this.gameActive = false;
			this.clearDangers();
		});
	}

	onStart() {
		// Run update loop for dangers
		RunService.Heartbeat.Connect((deltaTime) => {
			if (this.gameActive) {
				this.updateSauceBalls(deltaTime);
				this.updateExpandingPuddles(deltaTime);
			}
		});

		// Periodically spawn new dangers when game is active
		task.spawn(() => {
			while (true) {
				if (this.gameActive) {
					// Random chance to add new dangers
					if (math.random() < 0.1 && this.sauceBalls.size() < this.MAX_SAUCE_BALLS) {
						this.spawnSauceBall();
					}

					if (math.random() < 0.05 && this.expandingPuddles.size() < this.MAX_EXPANDING_PUDDLES) {
						this.spawnExpandingPuddle();
					}
				}
				task.wait(5); // Check every 5 seconds
			}
		});
	}

	private spawnInitialDangers() {
		this.clearDangers();

		// Create 1-2 sauce balls to start
		const numSauceBalls = math.random(1, 2);
		for (let i = 0; i < numSauceBalls; i++) {
			this.spawnSauceBall();
		}

		// Create 2-3 expanding puddles to start
		const numPuddles = math.random(2, 3);
		for (let i = 0; i < numPuddles; i++) {
			this.spawnExpandingPuddle();
		}
	}

	private spawnSauceBall() {
		if (!this.dangerFolder) return;

		// Create a floating sauce ball that will chase players
		const part = new Instance("Part");
		part.Name = "SauceBall";
		part.Shape = Enum.PartType.Ball;
		part.Size = new Vector3(3, 3, 3);

		// Random position above the map
		const x = math.random(-40, 40);
		const z = math.random(-40, 40);
		part.Position = new Vector3(x, 10, z);

		part.Anchored = true;
		part.CanCollide = false;
		part.BrickColor = new BrickColor("Bright red");
		part.Material = Enum.Material.SmoothPlastic;
		part.Transparency = 0.3;

		const id = HttpService.GenerateGUID(false);
		part.SetAttribute("id", id);
		part.SetAttribute("type", "SauceBall");

		// Add dripping effect
		const drip = new Instance("ParticleEmitter");
		drip.Color = new ColorSequence(Color3.fromRGB(255, 0, 0));
		drip.Lifetime = new NumberRange(0.5, 1);
		drip.Rate = 10;
		drip.Speed = new NumberRange(0, 1);
		drip.SpreadAngle = new Vector2(5, 5);
		drip.Acceleration = new Vector3(0, -10, 0);
		drip.Parent = part;

		// Add glow effect
		const light = new Instance("PointLight");
		light.Color = Color3.fromRGB(255, 0, 0);
		light.Brightness = 0.5;
		light.Range = 8;
		light.Parent = part;

		part.Parent = this.dangerFolder;

		// Register the sauce ball
		this.sauceBalls.push({
			id: id,
			part: part,
			speed: math.random(5, 15),
			lastTargetChange: 0,
			active: true,
		});

		// Announce new danger - replace direct bindings call with the method
		this.gameService.broadcastDangerAlert(part.Position, "SauceBall");
	}

	private spawnExpandingPuddle() {
		if (!this.dangerFolder) return;

		// Create a puddle that expands and contracts
		const part = new Instance("Part");
		part.Name = "ExpandingPuddle";

		// Random position on the map
		const x = math.random(-40, 40);
		const z = math.random(-40, 40);

		const baseSize = math.random(4, 8);
		const startSize = new Vector3(baseSize, 0.2, baseSize);
		const maxSize = new Vector3(baseSize * 2, 0.2, baseSize * 2);

		part.Size = startSize;
		part.Position = new Vector3(x, 0.1, z);
		part.Anchored = true;
		part.CanCollide = false;
		part.BrickColor = new BrickColor("Maroon");
		part.Material = Enum.Material.Neon;
		part.Transparency = 0.4;

		const id = HttpService.GenerateGUID(false);
		part.SetAttribute("id", id);
		part.SetAttribute("type", "ExpandingPuddle");
		part.SetAttribute("traps", true);

		// Add bubbling effect
		const bubbles = new Instance("ParticleEmitter");
		bubbles.Color = new ColorSequence(Color3.fromRGB(165, 50, 50));
		bubbles.Lifetime = new NumberRange(1, 2);
		bubbles.Rate = 3;
		bubbles.Speed = new NumberRange(0.1, 0.3);
		bubbles.SpreadAngle = new Vector2(10, 10);
		bubbles.Size = new NumberSequence(0.2, 0.5);
		bubbles.Parent = part;

		part.Parent = this.dangerFolder;

		// Register the puddle
		this.expandingPuddles.push({
			id: id,
			part: part,
			startSize: startSize,
			maxSize: maxSize,
			expandSpeed: math.random(0.2, 0.4),
			contractSpeed: math.random(0.1, 0.2),
			expanding: true,
			timer: math.random(5, 10),
		});

		// Announce new danger - replace direct bindings call with the method
		this.gameService.broadcastDangerAlert(part.Position, "ExpandingPuddle");
	}

	private updateSauceBalls(deltaTime: number) {
		// Move sauce balls toward their targets
		for (const ball of this.sauceBalls) {
			if (!ball.active) continue;

			const now = os.time();

			// Find a new target every 5 seconds or if no target exists
			if (!ball.target || now - ball.lastTargetChange > 5) {
				ball.target = this.findRandomTarget();
				ball.lastTargetChange = now;
			}

			// Move toward target if one exists
			if (ball.target && ball.target.Character) {
				const rootPart = ball.target.Character.FindFirstChild("HumanoidRootPart") as BasePart;
				if (rootPart) {
					// Calculate direction to target
					const targetPos = rootPart.Position;
					const direction = targetPos.sub(ball.part.Position).Unit;

					// Move toward target
					const newPos = ball.part.Position.add(direction.mul(ball.speed * deltaTime));
					ball.part.Position = new Vector3(newPos.X, math.max(2, newPos.Y), newPos.Z);

					// Check if close enough to drop sauce
					if (ball.part.Position.sub(targetPos).Magnitude < 10) {
						this.dropSauceFromBall(ball);
					}
				}
			}
		}
	}

	private updateExpandingPuddles(deltaTime: number) {
		// Expand and contract puddles
		for (let i = this.expandingPuddles.size() - 1; i >= 0; i--) {
			const puddle = this.expandingPuddles[i];
			puddle.timer -= deltaTime;

			// Switch direction if needed
			if (puddle.timer <= 0) {
				puddle.expanding = !puddle.expanding;
				puddle.timer = math.random(3, 8);
			}

			const currentSize = puddle.part.Size;
			let newSize: Vector3;

			if (puddle.expanding) {
				// Expand the puddle
				const expandAmount = puddle.expandSpeed * deltaTime;
				newSize = new Vector3(
					math.min(puddle.maxSize.X, currentSize.X + expandAmount),
					currentSize.Y,
					math.min(puddle.maxSize.Z, currentSize.Z + expandAmount),
				);
			} else {
				// Contract the puddle
				const contractAmount = puddle.contractSpeed * deltaTime;
				newSize = new Vector3(
					math.max(puddle.startSize.X, currentSize.X - contractAmount),
					currentSize.Y,
					math.max(puddle.startSize.Z, currentSize.Z - contractAmount),
				);
			}

			puddle.part.Size = newSize;
		}
	}

	private dropSauceFromBall(ball: SauceBall) {
		if (!this.dangerFolder || !ball.target) return;

		// Create a small puddle where the ball is
		const puddle = new Instance("Part");
		puddle.Name = "SauceDrop";
		puddle.Size = new Vector3(3, 0.2, 3);
		puddle.Position = new Vector3(ball.part.Position.X, 0.1, ball.part.Position.Z);
		puddle.Anchored = true;
		puddle.CanCollide = false;
		puddle.BrickColor = new BrickColor("Really red");
		puddle.Material = Enum.Material.Neon;
		puddle.Transparency = 0.3;

		const id = HttpService.GenerateGUID(false);
		puddle.SetAttribute("id", id);
		puddle.SetAttribute("type", "SauceDrop");
		puddle.SetAttribute("traps", true); // Mark as a trap so it can trap players

		puddle.Parent = this.dangerFolder;

		// Create splash effect
		const splash = new Instance("ParticleEmitter");
		splash.Color = new ColorSequence(Color3.fromRGB(255, 50, 50));
		splash.Lifetime = new NumberRange(0.5, 1);
		splash.Rate = 0;
		splash.Speed = new NumberRange(3, 5);
		splash.SpreadAngle = new Vector2(90, 90);
		splash.Acceleration = new Vector3(0, -10, 0);
		splash.Enabled = false;
		splash.Parent = puddle;

		// Emit once for splash effect
		splash.Emit(20);

		// Destroy after a few seconds
		task.delay(8, () => {
			if (puddle.Parent) {
				puddle.Destroy();
			}
		});
	}

	private findRandomTarget(): Player | undefined {
		// Get all players
		const players = Players.GetPlayers();
		if (players.size() === 0) return undefined;

		// Choose a random player
		return players[math.random(0, players.size() - 1)];
	}

	private clearDangers() {
		// Remove all danger objects
		if (this.dangerFolder) {
			for (const child of this.dangerFolder.GetChildren()) {
				child.Destroy();
			}
		}

		this.sauceBalls = [];
		this.expandingPuddles = [];
	}
}
