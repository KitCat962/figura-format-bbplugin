# Figura Project Format for Blockbench
Figura uses Blockbench for it's modeling, but some features of Blockbench will not be parsed by Figura.

This Plugin adds a Project Format that will remove the following features from Blockbench:
* Box UV (Controversal probably, but Per-Face is objectivly better)
* Animated Textures (Figura parses them as normal textures)
* Model Identifier (What even is this anyways? Regardless, Figura doesnt use it)
* Locators (Figura does not load them, and IK is not supported)
* Group Name Limitations (Duplicate names and arbitrary characters are now allowed)
