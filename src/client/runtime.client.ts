import { Flamework } from "@flamework/core";

// Add component and controller paths
Flamework.addPaths("src/client/Components");
Flamework.addPaths("src/client/Controllers");
Flamework.addPaths("src/shared/Components");

// Start the framework
Flamework.ignite();
