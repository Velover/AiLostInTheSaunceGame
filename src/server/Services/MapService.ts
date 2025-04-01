import { OnInit, OnStart, Service } from "@flamework/core";
import { Workspace } from "@rbxts/services";

@Service({})
export class MapService implements OnStart, OnInit {
	private mapFolder: Folder | undefined;

	onInit() {
		this.mapFolder = new Instance("Folder");
		this.mapFolder.Name = "GameMap";
		this.mapFolder.Parent = Workspace;

		// Create the map once on init
		this.createBaseMap();
	}

	onStart() {
		// Nothing needed on start
	}

	private createBaseMap() {
		if (!this.mapFolder) return;

		// Create the floor
		const floor = new Instance("Part");
		floor.Name = "Floor";
		floor.Size = new Vector3(120, 1, 120); // Large floor
		floor.Position = new Vector3(0, -0.5, 0); // Slightly below ground level
		floor.Anchored = true;
		floor.BrickColor = new BrickColor("Medium stone grey");
		floor.Material = Enum.Material.Concrete;

		// Create a texture for the floor
		const floorTexture = new Instance("Texture");
		floorTexture.Texture = "rbxassetid://9920985876"; // Use appropriate texture
		floorTexture.StudsPerTileU = 10;
		floorTexture.StudsPerTileV = 10;
		floorTexture.Face = Enum.NormalId.Top;
		floorTexture.Parent = floor;

		floor.Parent = this.mapFolder;

		// Create boundary walls
		this.createBoundaryWalls();

		// Create spawn point
		this.createSpawnPoint();

		// Create some decorative elements
		this.createDecorations();
	}

	private createBoundaryWalls() {
		if (!this.mapFolder) return;

		const wallHeight = 10;
		const wallThickness = 2;
		const mapSize = 60; // Half of floor size

		const wallPositions = [
			{
				position: new Vector3(0, wallHeight / 2, mapSize + wallThickness / 2),
				size: new Vector3(120 + wallThickness * 2, wallHeight, wallThickness),
			},
			{
				position: new Vector3(0, wallHeight / 2, -mapSize - wallThickness / 2),
				size: new Vector3(120 + wallThickness * 2, wallHeight, wallThickness),
			},
			{
				position: new Vector3(mapSize + wallThickness / 2, wallHeight / 2, 0),
				size: new Vector3(wallThickness, wallHeight, 120),
			},
			{
				position: new Vector3(-mapSize - wallThickness / 2, wallHeight / 2, 0),
				size: new Vector3(wallThickness, wallHeight, 120),
			},
		];

		const wallsFolder = new Instance("Folder");
		wallsFolder.Name = "Walls";
		wallsFolder.Parent = this.mapFolder;

		for (let i = 0; i < wallPositions.size(); i++) {
			const config = wallPositions[i];
			const wall = new Instance("Part");
			wall.Name = `Wall_${i + 1}`;
			wall.Size = config.size;
			wall.Position = config.position;
			wall.Anchored = true;
			wall.BrickColor = new BrickColor("Brick yellow");
			wall.Material = Enum.Material.Brick;
			wall.Parent = wallsFolder;

			// Add some texture to the walls
			const wallTexture = new Instance("Texture");
			wallTexture.Texture = "rbxassetid://9920967906"; // Use appropriate brick texture
			wallTexture.StudsPerTileU = 4;
			wallTexture.StudsPerTileV = 4;
			wallTexture.Face = i < 2 ? Enum.NormalId.Front : Enum.NormalId.Right;
			wallTexture.Parent = wall;
		}
	}

	private createSpawnPoint() {
		if (!this.mapFolder) return;

		// Create a visible spawn platform
		const spawnPlatform = new Instance("Part");
		spawnPlatform.Name = "SpawnPoint";
		spawnPlatform.Size = new Vector3(8, 1, 8);
		spawnPlatform.Position = new Vector3(0, 0.1, 0); // Slightly above ground
		spawnPlatform.Anchored = true;
		spawnPlatform.BrickColor = new BrickColor("Bright blue");
		spawnPlatform.Material = Enum.Material.Neon;
		spawnPlatform.Transparency = 0.5;
		spawnPlatform.Parent = this.mapFolder;

		// Add spawn effect
		const spawnEffect = new Instance("ParticleEmitter");
		spawnEffect.Color = new ColorSequence(Color3.fromRGB(100, 200, 255));
		spawnEffect.Size = new NumberSequence(1);
		spawnEffect.Transparency = new NumberSequence(0, 1);
		spawnEffect.Lifetime = new NumberRange(1, 2);
		spawnEffect.Rate = 10;
		spawnEffect.Speed = new NumberRange(1, 3);
		spawnEffect.SpreadAngle = new Vector2(0, 180);
		spawnEffect.Parent = spawnPlatform;

		// Add point light
		const light = new Instance("PointLight");
		light.Color = Color3.fromRGB(100, 200, 255);
		light.Brightness = 1;
		light.Range = 15;
		light.Parent = spawnPlatform;
	}

	private createDecorations() {
		if (!this.mapFolder) return;

		const decorationsFolder = new Instance("Folder");
		decorationsFolder.Name = "Decorations";
		decorationsFolder.Parent = this.mapFolder;

		// Create some kitchen-themed decorations around the map
		const decorations = [
			{
				position: new Vector3(20, 1, 20),
				size: new Vector3(8, 2, 4),
				color: "Reddish brown",
				name: "Table1",
			},
			{
				position: new Vector3(-15, 1, 30),
				size: new Vector3(6, 2, 6),
				color: "Reddish brown",
				name: "Table2",
			},
			{
				position: new Vector3(30, 5, -20),
				size: new Vector3(10, 10, 1),
				color: "Bright blue",
				name: "Cabinet",
			},
			{
				position: new Vector3(-40, 1, -40),
				size: new Vector3(15, 2, 8),
				color: "Bright green",
				name: "Counter",
			},
		];

		for (const decor of decorations) {
			const part = new Instance("Part");
			part.Name = decor.name;
			part.Size = decor.size;
			part.Position = decor.position;
			part.Anchored = true;

			part.BrickColor = new BrickColor(decor.color as never); //as never to avoid type error
			part.Material = Enum.Material.Plastic;
			part.Parent = decorationsFolder;
		}

		// Create some ambient lighting
		const ambientLight = new Instance("ColorCorrectionEffect");
		ambientLight.Brightness = 0.05;
		ambientLight.Contrast = 0.05;
		ambientLight.Saturation = 0.1;
		ambientLight.TintColor = Color3.fromRGB(255, 244, 229);
		ambientLight.Parent = Workspace;
	}
}
