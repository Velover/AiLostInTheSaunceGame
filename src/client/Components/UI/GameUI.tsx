import { useFlameworkDependency } from "@rbxts/flamework-react-utils";
import React, { useEffect, useState } from "@rbxts/react";
import { GameController } from "client/Controllers/GameController";
import { GameState, LeaderboardEntry } from "shared/network";
import { Events } from "../../network";

interface GameUIProps {
    visible: boolean;
}

export function GameUI({ visible }: GameUIProps) {
    const [gameState, setGameState] = useState<GameState>({
        timeRemaining: 0,
        ingredientsCollected: 0,
        totalIngredients: 0,
    });

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [victory, setVictory] = useState(false);

    const gameController = useFlameworkDependency<GameController>();

    useEffect(() => {
        const updateInterval = task.spawn(() => {
            while (true) {
                setGameState(gameController.getCurrentState());
                setLeaderboard(gameController.getLeaderboard());
                task.wait(0.5);
            }
        });

        // Hide tutorial after delay
        task.delay(10, () => {
            setShowTutorial(false);
        });

        // Add event listener for game over
        const gameOverConnection = Events.gameOver.connect((isVictory) => {
            setGameOver(true);
            setVictory(isVictory);
            setShowTutorial(false);
        });

        return () => {
            task.cancel(updateInterval);
            gameOverConnection.Disconnect();
        };
    }, []);

    const toggleLeaderboard = () => {
        setShowLeaderboard(!showLeaderboard);
    };

    const startGame = () => {
        gameController.startGame();
        setShowTutorial(false);
    };

    if (!visible) return undefined;

    // Game Over Screen
    if (gameOver) {
        return (
            <frame
                AnchorPoint={new Vector2(0.5, 0.5)}
                Position={UDim2.fromScale(0.5, 0.5)}
                Size={UDim2.fromOffset(400, 300)}
                BackgroundColor3={victory ? Color3.fromRGB(50, 100, 50) : Color3.fromRGB(100, 50, 50)}
                BackgroundTransparency={0.2}
                BorderSizePixel={0}
            >
                <uicorner CornerRadius={new UDim(0, 8)} />
                <uipadding
                    PaddingTop={new UDim(0, 15)}
                    PaddingBottom={new UDim(0, 15)}
                    PaddingLeft={new UDim(0, 15)}
                    PaddingRight={new UDim(0, 15)}
                />

                <textlabel
                    Text={victory ? "Victory!" : "Game Over!"}
                    Size={UDim2.fromScale(1, 0.2)}
                    BackgroundTransparency={1}
                    Font={Enum.Font.GothamBold}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    TextSize={32}
                    TextXAlignment={Enum.TextXAlignment.Center}
                />

                <textlabel
                    Text={
                        victory
                            ? `You collected all ${gameState.totalIngredients} ingredients!`
                            : `You collected ${gameState.ingredientsCollected} out of ${gameState.totalIngredients} ingredients.`
                    }
                    Position={UDim2.fromScale(0, 0.25)}
                    Size={UDim2.fromScale(1, 0.15)}
                    BackgroundTransparency={1}
                    Font={Enum.Font.GothamMedium}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    TextSize={18}
                    TextWrapped={true}
                    TextXAlignment={Enum.TextXAlignment.Center}
                />

                <textbutton
                    Text="Play Again"
                    Position={UDim2.fromScale(0.5, 0.7)}
                    Size={UDim2.fromOffset(150, 40)}
                    AnchorPoint={new Vector2(0.5, 0.5)}
                    BackgroundColor3={Color3.fromRGB(76, 175, 80)}
                    BorderSizePixel={0}
                    Font={Enum.Font.GothamBold}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    TextSize={16}
                    Event={{
                        MouseButton1Click: () => {
                            setGameOver(false);
                            setVictory(false);
                            gameController.startGame();
                        },
                    }}
                >
                    <uicorner CornerRadius={new UDim(0, 4)} />
                </textbutton>
            </frame>
        );
    }

    return (
        <>
            {/* Main HUD Panel */}
            <frame
                AnchorPoint={new Vector2(0, 0)}
                Position={UDim2.fromScale(0.02, 0.02)}
                Size={UDim2.fromOffset(200, 150)}
                BackgroundColor3={Color3.fromRGB(40, 40, 40)}
                BackgroundTransparency={0.3}
                BorderSizePixel={0}
            >
                <uicorner CornerRadius={new UDim(0, 8)} />
                <uipadding
                    PaddingTop={new UDim(0, 10)}
                    PaddingBottom={new UDim(0, 10)}
                    PaddingLeft={new UDim(0, 10)}
                    PaddingRight={new UDim(0, 10)}
                />

                <textlabel
                    Text="Lost in the Sauce"
                    Size={UDim2.fromScale(1, 0.2)}
                    BackgroundTransparency={1}
                    Font={Enum.Font.GothamBold}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    TextSize={18}
                    TextXAlignment={Enum.TextXAlignment.Left}
                />

                <textlabel
                    Text={`Time: ${gameState.timeRemaining}s`}
                    Position={UDim2.fromScale(0, 0.2)}
                    Size={UDim2.fromScale(1, 0.2)}
                    BackgroundTransparency={1}
                    Font={Enum.Font.GothamMedium}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    TextSize={14}
                    TextXAlignment={Enum.TextXAlignment.Left}
                />

                <textlabel
                    Text={`Ingredients: ${gameState.ingredientsCollected}/${gameState.totalIngredients}`}
                    Position={UDim2.fromScale(0, 0.4)}
                    Size={UDim2.fromScale(1, 0.2)}
                    BackgroundTransparency={1}
                    Font={Enum.Font.GothamMedium}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    TextSize={14}
                    TextXAlignment={Enum.TextXAlignment.Left}
                />

                <frame
                    Position={UDim2.fromScale(0, 0.6)}
                    Size={UDim2.fromScale(1, 0.4)}
                    BackgroundTransparency={1}
                >
                    <uilistlayout
                        FillDirection={Enum.FillDirection.Horizontal}
                        HorizontalAlignment={Enum.HorizontalAlignment.Center}
                        VerticalAlignment={Enum.VerticalAlignment.Center}
                        Padding={new UDim(0, 10)}
                    />

                    <textbutton
                        Text="Start Game"
                        Size={new UDim2(0.6, 0, 0.6, 0)}
                        BackgroundColor3={Color3.fromRGB(76, 175, 80)}
                        BorderSizePixel={0}
                        Font={Enum.Font.GothamBold}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        TextSize={14}
                        Event={{
                            MouseButton1Click: startGame,
                        }}
                    >
                        <uicorner CornerRadius={new UDim(0, 4)} />
                    </textbutton>

                    <textbutton
                        Text="Leaderboard"
                        Size={new UDim2(0.4, 0, 0.6, 0)}
                        BackgroundColor3={Color3.fromRGB(64, 115, 255)}
                        BorderSizePixel={0}
                        Font={Enum.Font.GothamBold}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        TextSize={14}
                        Event={{
                            MouseButton1Click: toggleLeaderboard,
                        }}
                    >
                        <uicorner CornerRadius={new UDim(0, 4)} />
                    </textbutton>
                </frame>
            </frame>

            {/* Tutorial Panel */}
            {showTutorial && (
                <frame
                    AnchorPoint={new Vector2(0.5, 0.5)}
                    Position={UDim2.fromScale(0.5, 0.5)}
                    Size={UDim2.fromOffset(400, 300)}
                    BackgroundColor3={Color3.fromRGB(30, 30, 30)}
                    BackgroundTransparency={0.1}
                    BorderSizePixel={0}
                >
                    <uicorner CornerRadius={new UDim(0, 8)} />
                    <uipadding
                        PaddingTop={new UDim(0, 15)}
                        PaddingBottom={new UDim(0, 15)}
                        PaddingLeft={new UDim(0, 15)}
                        PaddingRight={new UDim(0, 15)}
                    />

                    <textlabel
                        Text="Lost in the Sauce - Tutorial"
                        Size={UDim2.fromScale(1, 0.15)}
                        BackgroundTransparency={1}
                        Font={Enum.Font.GothamBold}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        TextSize={22}
                        TextXAlignment={Enum.TextXAlignment.Center}
                    />

                    <textlabel
                        Text="You're lost in a sauce maze! Collect all ingredients while avoiding sauce puddles."
                        Position={UDim2.fromScale(0, 0.2)}
                        Size={UDim2.fromScale(1, 0.15)}
                        BackgroundTransparency={1}
                        Font={Enum.Font.GothamMedium}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        TextSize={16}
                        TextWrapped={true}
                    />

                    <frame
                        Position={UDim2.fromScale(0, 0.4)}
                        Size={UDim2.fromScale(1, 0.4)}
                        BackgroundTransparency={1}
                    >
                        <uilistlayout
                            FillDirection={Enum.FillDirection.Vertical}
                            HorizontalAlignment={Enum.HorizontalAlignment.Left}
                            VerticalAlignment={Enum.VerticalAlignment.Top}
                            Padding={new UDim(0, 10)}
                        />

                        <textlabel
                            Text="• Hover colored ingredients to collect them"
                            Size={new UDim2(1, 0, 0, 20)}
                            BackgroundTransparency={1}
                            Font={Enum.Font.GothamMedium}
                            TextColor3={Color3.fromRGB(255, 255, 255)}
                            TextSize={14}
                            TextXAlignment={Enum.TextXAlignment.Left}
                        />

                        <textlabel
                            Text="• Avoid red sauce puddles - they'll trap you!"
                            Size={new UDim2(1, 0, 0, 20)}
                            BackgroundTransparency={1}
                            Font={Enum.Font.GothamMedium}
                            TextColor3={Color3.fromRGB(255, 255, 255)}
                            TextSize={14}
                            TextXAlignment={Enum.TextXAlignment.Left}
                        />

                        <textlabel
                            Text="• Collect as many ingredients as possible before time runs out"
                            Size={new UDim2(1, 0, 0, 20)}
                            BackgroundTransparency={1}
                            Font={Enum.Font.GothamMedium}
                            TextColor3={Color3.fromRGB(255, 255, 255)}
                            TextSize={14}
                            TextXAlignment={Enum.TextXAlignment.Left}
                        />

                        <textlabel
                            Text="• Press P to start a new game at any time"
                            Size={new UDim2(1, 0, 0, 20)}
                            BackgroundTransparency={1}
                            Font={Enum.Font.GothamMedium}
                            TextColor3={Color3.fromRGB(255, 255, 255)}
                            TextSize={14}
                            TextXAlignment={Enum.TextXAlignment.Left}
                        />
                    </frame>

                    <textbutton
                        Text="Start Game"
                        Position={UDim2.fromScale(0.5, 0.85)}
                        Size={UDim2.fromOffset(150, 40)}
                        AnchorPoint={new Vector2(0.5, 0.5)}
                        BackgroundColor3={Color3.fromRGB(76, 175, 80)}
                        BorderSizePixel={0}
                        Font={Enum.Font.GothamBold}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        TextSize={16}
                        Event={{
                            MouseButton1Click: startGame,
                        }}
                    >
                        <uicorner CornerRadius={new UDim(0, 4)} />
                    </textbutton>
                </frame>
            )}

            {/* Leaderboard Panel */}
            {showLeaderboard && (
                <frame
                    AnchorPoint={new Vector2(1, 0)}
                    Position={UDim2.fromScale(0.98, 0.02)}
                    Size={UDim2.fromOffset(250, 300)}
                    BackgroundColor3={Color3.fromRGB(40, 40, 40)}
                    BackgroundTransparency={0.3}
                    BorderSizePixel={0}
                >
                    <uicorner CornerRadius={new UDim(0, 8)} />
                    <uipadding
                        PaddingTop={new UDim(0, 10)}
                        PaddingBottom={new UDim(0, 10)}
                        PaddingLeft={new UDim(0, 10)}
                        PaddingRight={new UDim(0, 10)}
                    />

                    <textlabel
                        Text="Leaderboard"
                        Size={UDim2.fromScale(1, 0.1)}
                        BackgroundTransparency={1}
                        Font={Enum.Font.GothamBold}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        TextSize={18}
                        TextXAlignment={Enum.TextXAlignment.Center}
                    />

                    <scrollingframe
                        Position={UDim2.fromScale(0, 0.1)}
                        Size={UDim2.fromScale(1, 0.8)}
                        BackgroundTransparency={1}
                        BorderSizePixel={0}
                        ScrollBarThickness={6}
                        CanvasSize={UDim2.fromScale(0, math.max(1, leaderboard.size() * 0.1))}
                        ScrollingDirection={Enum.ScrollingDirection.Y}
                    >
                        <uilistlayout
                            Padding={new UDim(0, 5)}
                            SortOrder={Enum.SortOrder.LayoutOrder}
                        />

                        {leaderboard.map((entry, index) => (
                            <frame
                                key={entry.playerName}
                                Size={new UDim2(1, 0, 0, 30)}
                                BackgroundColor3={Color3.fromRGB(60, 60, 60)}
                                BackgroundTransparency={0.5}
                                LayoutOrder={index}
                            >
                                <uicorner CornerRadius={new UDim(0, 4)} />

                                <textlabel
                                    Text={`${index + 1}. ${entry.playerName}`}
                                    Position={UDim2.fromScale(0, 0)}
                                    Size={UDim2.fromScale(0.7, 1)}
                                    BackgroundTransparency={1}
                                    Font={Enum.Font.GothamMedium}
                                    TextColor3={Color3.fromRGB(255, 255, 255)}
                                    TextSize={14}
                                    TextXAlignment={Enum.TextXAlignment.Left}
                                />

                                <textlabel
                                    Text={tostring(entry.score)}
                                    Position={UDim2.fromScale(0.7, 0)}
                                    Size={UDim2.fromScale(0.3, 1)}
                                    BackgroundTransparency={1}
                                    Font={Enum.Font.GothamBold}
                                    TextColor3={Color3.fromRGB(255, 255, 255)}
                                    TextSize={14}
                                    TextXAlignment={Enum.TextXAlignment.Right}
                                />
                            </frame>
                        ))}
                    </scrollingframe>

                    <textbutton
                        Text="Close"
                        Position={UDim2.fromScale(0.5, 0.925)}
                        Size={UDim2.fromOffset(100, 30)}
                        AnchorPoint={new Vector2(0.5, 0.5)}
                        BackgroundColor3={Color3.fromRGB(200, 80, 80)}
                        BorderSizePixel={0}
                        Font={Enum.Font.GothamMedium}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        TextSize={14}
                        Event={{
                            MouseButton1Click: toggleLeaderboard,
                        }}
                    >
                        <uicorner CornerRadius={new UDim(0, 4)} />
                    </textbutton>
                </frame>
            )}

            {/* Game status notifications */}
            <frame
                AnchorPoint={new Vector2(0.5, 0)}
                Position={UDim2.fromScale(0.5, 0.05)}
                Size={UDim2.fromOffset(500, 40)}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Visible={gameState.timeRemaining > 0}
            >
                <textlabel
                    Text={gameState.timeRemaining <= 10 ? "Hurry up! Time is running out!" : ""}
                    Size={UDim2.fromScale(1, 1)}
                    BackgroundTransparency={1}
                    Font={Enum.Font.GothamBold}
                    TextColor3={Color3.fromRGB(255, 100, 100)}
                    TextSize={24}
                    TextStrokeTransparency={0.5}
                />
            </frame>
        </>
    );
}
