import { OnStart } from "@flamework/core";
import { Component, BaseComponent } from "@flamework/components";
import { IngredientType } from "shared/types/GameTypes";
import { Workspace } from "@rbxts/services";

interface Attributes {
	id: string;
	type: IngredientType;
	collected: boolean;
}

@Component({
	tag: "Ingredient",
})
export class IngredientComponent extends BaseComponent<Attributes, Part> implements OnStart {
	private animationTask?: thread;

	onStart() {
		const id = this.attributes.id;
		const attribute_type = this.attributes.type;

		// Set up visual appearance
		this.instance.Name = `Ingredient_${attribute_type}_${id}`;
		this.instance.Anchored = true;
		this.instance.CanCollide = false;
		this.instance.Shape = Enum.PartType.Ball;
		this.instance.Material = Enum.Material.SmoothPlastic;

		// Set different colors and sizes based on ingredient type
		switch (attribute_type) {
			case IngredientType.Tomato:
				this.instance.BrickColor = new BrickColor("Bright red");
				this.instance.Size = new Vector3(1.2, 1.2, 1.2);
				break;
			case IngredientType.Garlic:
				this.instance.BrickColor = new BrickColor("White");
				this.instance.Size = new Vector3(0.8, 0.8, 0.8);
				break;
			case IngredientType.Basil:
				this.instance.BrickColor = new BrickColor("Bright green");
				this.instance.Size = new Vector3(0.6, 0.6, 0.6);
				break;
			case IngredientType.Oregano:
				this.instance.BrickColor = new BrickColor("Medium green");
				this.instance.Size = new Vector3(0.5, 0.5, 0.5);
				break;
			case IngredientType.Pepper:
				this.instance.BrickColor = new BrickColor("Black");
				this.instance.Size = new Vector3(0.7, 0.7, 0.7);
				break;
		}

		// Add glow effect
		const glow = new Instance("PointLight");
		glow.Brightness = 1;
		glow.Range = 5;
		glow.Color = this.instance.Color;
		glow.Parent = this.instance;

		// Add sparkles effect
		const sparkles = new Instance("Sparkles");
		sparkles.Color = this.instance.Color;
		sparkles.SparkleColor = this.instance.Color;
		sparkles.Parent = this.instance;

		// Add hover animation
		this.startHoverAnimation();
	}

	private startHoverAnimation() {
		const initialPosition = this.instance.Position;

		this.animationTask = task.spawn(() => {
			let rotation = 0;

			while (this.instance && this.instance.Parent) {
				if (this.attributes.collected) break;

				// Hover up and down
				const hover = math.sin(os.clock() * 2) * 0.5;
				// Rotate around Y axis
				rotation += 0.02;

				this.instance.Position = initialPosition.add(new Vector3(0, hover, 0));
				this.instance.Orientation = new Vector3(0, (rotation * 180) / math.pi, 0);

				task.wait(0.03);
			}
		});
	}

	onStop() {
		// Clean up animation task
		if (this.animationTask) {
			task.cancel(this.animationTask);
		}
	}

	// Public method to handle ingredient collection
	public collect(): void {
		if (this.instance && this.instance.Parent) {
			// Mark as collected
			this.attributes.collected = true;

			// Play collection effect
			const effect = new Instance("ParticleEmitter");
			effect.Color = new ColorSequence(this.instance.Color);
			effect.Lifetime = new NumberRange(0.5, 1);
			effect.Speed = new NumberRange(5, 10);
			effect.Acceleration = new Vector3(0, 10, 0);
			effect.SpreadAngle = new Vector2(50, 50);
			effect.EmissionDirection = Enum.NormalId.Front;
			effect.Rate = 50;
			effect.LightEmission = 1;
			effect.LightInfluence = 0;
			effect.Parent = this.instance;

			// Scale down animation
			const originalSize = this.instance.Size;
			const startTime = os.clock();
			const duration = 0.5;

			task.spawn(() => {
				while (this.instance && this.instance.Parent) {
					const elapsed = os.clock() - startTime;
					const alpha = math.clamp(elapsed / duration, 0, 1);

					this.instance.Size = originalSize.mul(1 - alpha);
					this.instance.Transparency = alpha;

					if (alpha >= 1) break;
					task.wait();
				}

				if (this.instance && this.instance.Parent) {
					this.instance.Destroy();
				}
			});
		}
	}
}
