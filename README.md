# Figura Project Format for Blockbench
Figura uses Blockbench for it's modeling, but some features of Blockbench will not be parsed by Figura.

This Plugin adds a Project Format that will remove the following features from Blockbench:
* Animated Textures
* Model Identifier
* Locators (Figura does not load them, and IK is not supported)
* Group Name Limitations (Duplicate names and arbitrary characters are now allowed)
* Molang Errors (Figura uses Lua in keyframes)
* Texture Render Mode (Figura uses a more advanced system for emissive textures)
* Particle and Sound keyframes

The Plugin makes the following changes to improve clarity:
* New Animations will be named `new` instead of the confusing name `animation.model.new`
* Instruction keyframes have been renamed to Lua Script keyframes
* The Anim Time Update property has been renamed to Start Offset, as that is how that property is used in Figura
* Override has been renamed to Override Vanilla Animations
* The Export Animations action has been removed

Additionally, the Figura Project Format adds these features:
* The "Match Project UV with Texture Size" Toggle under Tools, which will automatically set the Project UV to match the current texture to prevent the texture behaving weird in the preview (Not available with BoxUV)
* The "Cycle Face Vertices action", which will allow you to change the triangulation of non-flat faces (You may need to use this multiple times, and/or invert the face for correct normals)