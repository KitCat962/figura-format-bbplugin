# Figura Project Format for Blockbench
Figura uses Blockbench for it's modeling, but some features of Blockbench will not be parsed by Figura.

This Plugin adds a Project Format that will remove the following features from Blockbench:
* Animated Textures (Figura parses them as normal textures)
* Model Identifier (What even is this anyways? Regardless, Figura doesnt use it)
* Locators (Figura does not load them, and IK is not supported)
* Group Name Limitations (Duplicate names and arbitrary characters are now allowed)
* Molang Errors (Figura uses lua, not molang)
* Particle and Sound keyframes (They cannot be deleted, but they *have* been renamed to `"N/A"`)
* New Animations will not have long names (`animation.model.new`=>`new`)
* Instruction keyframes have been renamed to Lua Script
* The Anim Time Update property has been renamed to Start Offset, as that is how that property is used in Figura

Additionally, the Figura Project Format adds these features:
* A Toggle to automatically set the Project UV to match the current texture size (Not available with BoxUV)
