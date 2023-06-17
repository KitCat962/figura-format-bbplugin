# Figura Project Format for Blockbench
Figura uses Blockbench for it's modeling, but some features of Blockbench will not be parsed by Figura.

This Plugin adds a Project Format that will remove the following features from Blockbench:
* Animated Textures (Figura parses them as normal textures)
* Model Identifier (What even is this anyways? Regardless, Figura doesnt use it)
* Locators (Figura does not load them, and IK is not supported)
* Group Name Limitations (Duplicate names and arbitrary characters are now allowed)
* Molang Errors (Figura uses lua, not molang)
* Texture Render Mode (Figura uses a more advanced system for emissive textures)

The Plugin makes the following changes to improve clarity:
* Particle and Sound keyframes have been renamed to `"N/A"` as they are not used by Figura
* New Animations will be named `new` instead of the confusing name `animation.model.new`
* Instruction keyframes have been renamed to Lua Script keyframes
* The Anim Time Update property has been renamed to Start Offset, as that is how that property is used in Figura
* Override has been renamed to Override Vanilla Animations
* The Export Animations action has been removed

Additionally, the Figura Project Format adds these features:
* A Toggle to automatically set the Project UV to match the current texture size (Not available with BoxUV)
