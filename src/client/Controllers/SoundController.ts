import { Controller, OnInit, OnStart } from "@flamework/core";
import { SoundService, Players } from "@rbxts/services";
import { Events } from "client/network";

@Controller({})
export class SoundController implements OnStart, OnInit {
	// Sound IDs - replace with appropriate asset IDs
	private static readonly COLLECT_SOUND_ID = "rbxassetid://9125712561";
	private static readonly TRAPPED_SOUND_ID = "rbxassetid://142082166";
	private static readonly GAME_START_SOUND_ID = "rbxassetid://1171115853";
	private static readonly GAME_END_SOUND_ID = "rbxassetid://5869422451";
	private static readonly BACKGROUND_MUSIC_ID = "rbxassetid://5410080475";

	private backgroundMusic?: Sound;
	private soundGroup?: SoundGroup;

	onInit() {
		// Create a sound group to manage volumes
		this.soundGroup = new Instance("SoundGroup");
		this.soundGroup.Name = "GameSounds";
		this.soundGroup.Volume = 0.5;
		this.soundGroup.Parent = SoundService;

		// Create background music
		this.backgroundMusic = new Instance("Sound");
		this.backgroundMusic.Name = "BackgroundMusic";
		this.backgroundMusic.SoundId = SoundController.BACKGROUND_MUSIC_ID;
		this.backgroundMusic.Volume = 0.3;
		this.backgroundMusic.Looped = true;
		this.backgroundMusic.SoundGroup = this.soundGroup;
		this.backgroundMusic.Parent = SoundService;

		// Set up event connections
		Events.gameStarted.connect(() => this.onGameStart());
		Events.updateGameState.connect((state) => {
			if (state.timeRemaining <= 0) {
				this.onGameEnd();
			}
		});
		Events.ingredientCollected.connect((id, playerName) => {
			if (playerName === Players.LocalPlayer.Name) {
				this.playCollectionSound();
			}
		});
		Events.playerTrapped.connect((playerName) => {
			if (playerName === Players.LocalPlayer.Name) {
				this.playTrappedSound();
			}
		});
	}

	onStart() {
		// Start background music with a fade-in
		if (this.backgroundMusic) {
			this.backgroundMusic.Volume = 0;
			this.backgroundMusic.Play();

			// Fade in the music
			this.fadeVolumeIn(this.backgroundMusic, 0.3, 2);
		}
	}

	private onGameStart() {
		this.playSound(SoundController.GAME_START_SOUND_ID, 0.7);
	}

	private onGameEnd() {
		this.playSound(SoundController.GAME_END_SOUND_ID, 0.7);
	}

	private playCollectionSound() {
		this.playSound(SoundController.COLLECT_SOUND_ID, 0.5);
	}

	private playTrappedSound() {
		this.playSound(SoundController.TRAPPED_SOUND_ID, 0.7);
	}

	private playSound(soundId: string, volume: number) {
		const sound = new Instance("Sound");
		sound.SoundId = soundId;
		sound.Volume = volume;
		sound.SoundGroup = this.soundGroup;
		sound.Parent = SoundService;
		sound.Play();

		// Clean up after playing
		sound.Ended.Connect(() => {
			sound.Destroy();
		});
	}

	private fadeVolumeIn(sound: Sound, targetVolume: number, duration: number) {
		const startTime = os.clock();

		task.spawn(() => {
			while (sound && sound.Parent) {
				const elapsed = os.clock() - startTime;
				const alpha = math.clamp(elapsed / duration, 0, 1);

				sound.Volume = targetVolume * alpha;

				if (alpha >= 1) break;
				task.wait(0.05);
			}
		});
	}
}
