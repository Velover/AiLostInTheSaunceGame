import { OnStart } from "@flamework/core";
import { Component, BaseComponent } from "@flamework/components";
import { ObstacleType } from "shared/types/GameTypes";

interface Attributes {
	id: string;
	type: ObstacleType;
}

@Component({
	tag: "Obstacle",
})
export class ObstacleComponent extends BaseComponent<Attributes, Part> implements OnStart {
	onStart() {
		const id = this.attributes.id;
		const attributes_type = this.attributes.type;

		// Make sure part is correctly set up
		this.instance.Anchored = true;
		this.instance.CanCollide = true;
		this.instance.Transparency = 0.3;

		// Different visual appearances based on obstacle type
		switch (attributes_type) {
			case ObstacleType.SaucePool:
				this.setupSaucePool();
				break;
			case ObstacleType.Spill:
				this.setupSpill();
				break;
			case ObstacleType.StickyFloor:
				this.setupStickyFloor();
				break;
		}
	}

	private setupSaucePool() {
		this.instance.Material = Enum.Material.Neon;
		this.instance.BrickColor = new BrickColor("Really red");
		this.instance.Size = new Vector3(
			this.instance.Size.X,
			0.2, // Make it shallow
			this.instance.Size.Z,
		);

		// Add bubbling effect
		const bubbles = new Instance("ParticleEmitter");
		bubbles.Color = new ColorSequence(Color3.fromRGB(255, 100, 100));
		bubbles.Size = new NumberSequence(0.3);
		bubbles.Transparency = new NumberSequence(0.5, 1);
		bubbles.Lifetime = new NumberRange(1, 2);
		bubbles.Rate = 5;
		bubbles.Speed = new NumberRange(0.5, 1);
		bubbles.SpreadAngle = new Vector2(10, 10);
		bubbles.Parent = this.instance;

		// Add light effect
		const light = new Instance("PointLight");
		light.Color = Color3.fromRGB(255, 50, 50);
		light.Brightness = 0.5;
		light.Range = 4;
		light.Parent = this.instance;

		// Animate light and transparency
		task.spawn(() => {
			while (this.instance && this.instance.Parent) {
				const pulse = (math.sin(os.clock() * 2) + 1) / 5;
				this.instance.Transparency = 0.3 + pulse * 0.2;
				light.Brightness = 0.3 + pulse;
				task.wait(0.05);
			}
		});
	}

	private setupSpill() {
		this.instance.Material = Enum.Material.Slate;
		this.instance.BrickColor = new BrickColor("Bright orange");
		this.instance.Size = new Vector3(
			this.instance.Size.X,
			0.1, // Very thin
			this.instance.Size.Z,
		);

		// Splash effect on creation
		const splash = new Instance("ParticleEmitter");
		splash.Color = new ColorSequence(Color3.fromRGB(255, 140, 50));
		splash.Size = new NumberSequence(0.5);
		splash.Transparency = new NumberSequence(0, 1);
		splash.Lifetime = new NumberRange(0.5, 1);
		splash.Rate = 20;
		splash.Speed = new NumberRange(3, 5);
		splash.SpreadAngle = new Vector2(20, 20);
		splash.Enabled = false; // One burst only
		splash.Parent = this.instance;

		// Burst effect
		splash.Emit(15);

		// Create spill pattern using decals
		for (let i = 0; i < 3; i++) {
			const decal = new Instance("Decal");
			decal.Texture = "rbxassetid://151851645"; // Use appropriate decal ID
			decal.Transparency = 0.3;
			decal.Face = i === 0 ? Enum.NormalId.Top : i === 1 ? Enum.NormalId.Right : Enum.NormalId.Left;
			decal.Parent = this.instance;
		}
	}

	private setupStickyFloor() {
		this.instance.Material = Enum.Material.Fabric;
		this.instance.BrickColor = new BrickColor("Brown");
		this.instance.Size = new Vector3(
			this.instance.Size.X,
			0.05, // Very thin
			this.instance.Size.Z,
		);

		// Create sticky texture
		const texture = new Instance("Texture");
		texture.Texture = "rbxassetid://148388697"; // Use appropriate texture ID
		texture.StudsPerTileU = 2;
		texture.StudsPerTileV = 2;
		texture.Face = Enum.NormalId.Top;
		texture.Parent = this.instance;

		// Create small particles occasionally rising
		const particles = new Instance("ParticleEmitter");
		particles.Color = new ColorSequence(Color3.fromRGB(100, 70, 40));
		particles.Size = new NumberSequence(0.1, 0.2);
		particles.Transparency = new NumberSequence(0.5, 1);
		particles.Lifetime = new NumberRange(2, 3);
		particles.Rate = 0.5;
		particles.Speed = new NumberRange(0.1, 0.3);
		particles.SpreadAngle = new Vector2(15, 15);
		particles.Parent = this.instance;
	}
}
