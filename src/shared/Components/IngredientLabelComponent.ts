import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { IngredientType } from "shared/types/GameTypes";

interface Attributes {
	id: string;
	type: IngredientType;
}

@Component({
	tag: "IngredientLabel",
})
export class IngredientLabelComponent extends BaseComponent<Attributes, Part> implements OnStart {
	onStart() {
		const part = this.instance;
		const attribute_type = this.attributes.type;

		// Create billboard GUI for ingredient label
		const billboardGui = new Instance("BillboardGui");
		billboardGui.Size = new UDim2(0, 100, 0, 40);
		billboardGui.StudsOffset = new Vector3(0, 1.5, 0);
		billboardGui.AlwaysOnTop = true;
		billboardGui.LightInfluence = 0;

		// Only show labels to players within 30 studs
		billboardGui.MaxDistance = 30;

		const frame = new Instance("Frame");
		frame.Size = UDim2.fromScale(1, 1);
		frame.BackgroundTransparency = 1;
		frame.Parent = billboardGui;

		const nameLabel = new Instance("TextLabel");
		nameLabel.Size = UDim2.fromScale(1, 0.6);
		nameLabel.Position = UDim2.fromScale(0, 0);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = attribute_type;
		nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255);
		nameLabel.TextStrokeTransparency = 0.5;
		nameLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
		nameLabel.TextScaled = true;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.Parent = frame;

		const pointsLabel = new Instance("TextLabel");
		pointsLabel.Size = UDim2.fromScale(1, 0.4);
		pointsLabel.Position = UDim2.fromScale(0, 0.6);
		pointsLabel.BackgroundTransparency = 1;
		pointsLabel.Text = "+10 points";
		pointsLabel.TextColor3 = Color3.fromRGB(255, 255, 100);
		pointsLabel.TextStrokeTransparency = 0.5;
		pointsLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
		pointsLabel.TextScaled = true;
		pointsLabel.Font = Enum.Font.GothamMedium;
		pointsLabel.Parent = frame;

		billboardGui.Parent = part;

		// Animate the label
		this.animateLabel(billboardGui);
	}

	private animateLabel(gui: BillboardGui) {
		// Make label gently bob up and down
		task.spawn(() => {
			const initialOffset = gui.StudsOffset;

			while (gui && gui.Parent) {
				const yOffset = math.sin(os.clock()) * 0.2;
				gui.StudsOffset = new Vector3(initialOffset.X, initialOffset.Y + yOffset, initialOffset.Z);

				task.wait(0.03);
			}
		});
	}
}
