(function () {

    let modelFormat
    let shouldMatchTextureSize = false
    let toggleMatchTextureSize = new Toggle('match-texture-size', {
        name: "Match Project UV with Texture Size",
        default: false,
        description: "Changes the ProjectUV so that it will always match the size of the active Texture.",
        condition: () => Format.id == 'figura' && !Project.box_uv,
        onChange(state) {
            shouldMatchTextureSize = state
            if (state)
                updateProjectUV()
        }
    })
    let _width = 0, _height = 0
    function updateProjectUV() {
        if (Project.box_uv) return

        Cube.all.forEach(cube => {
            cube.setUVMode(false);
        })

        let texture = UVEditor.texture != 0 ? UVEditor.texture : Texture.selected
        let texture_width = texture.width,
            texture_height = texture.height
        if (texture != null && (texture_width != _width || texture_height != _height)) {
            Cube.all.forEach(cube => {
                for (var key in cube.faces) {
                    var uv = cube.faces[key].uv;
                    uv[0] *= texture_width / Project.texture_width;
                    uv[2] *= texture_width / Project.texture_width;
                    uv[1] *= texture_height / Project.texture_height;
                    uv[3] *= texture_height / Project.texture_height;
                }
            })
            Mesh.all.forEach(mesh => {
                for (var key in mesh.faces) {
                    var uv = mesh.faces[key].uv;
                    for (let vkey in uv) {
                        uv[vkey][0] *= texture_width / Project.texture_width;
                        uv[vkey][1] *= texture_height / Project.texture_height;
                    }
                }
            })

            Project.texture_width = _width = texture_width;
            Project.texture_height = _height = texture_height;
            Canvas.updateAllUVs()
        }
    }

    BBPlugin.register('figura-format', {
        title: 'Figura Model Format',
        author: 'KitCat962',
        icon: 'change_history',
        description: 'A custom Model Format for use with the Figura mod, stripping Blockbench features that are incompatible.',
        version: '0.0.3',
        min_version: '4.7.0',
        tags: ['Minecraft: Java Edition', 'Figura'],
        variant: 'both',
        await_loading: true,
        onload() {
            Group.prototype.name_regex = () => Format.id == "figura" ? false : Format.bone_rig ? 'a-zA-Z0-9_' : false;
            Group.prototype.needsUniqueName = () => Format.id == "figura" ? false : Format.bone_rig;

            let molangSyntax = Validator.checks.find(element => element.id == 'molang_syntax')
            if (molangSyntax)
                molangSyntax.condition = () => Format.id == "figura" ? false : Format.animation_mode

            let callback
            let particle = EffectAnimator.prototype.channels.particle.name,
                sound = EffectAnimator.prototype.channels.sound.name
            modelFormat = new ModelFormat('figura', {
                icon: 'change_history',
                name: 'Figura',
                description: 'Generic Format clone that removes features that Figura does not support.',
                category: 'low_poly',
                target: ['Figura'],
                show_on_start_screen: true,
                box_uv: false,
                optional_box_uv: true,
                single_texture: false,
                model_identifier: false,
                parent_model_id: false,
                vertex_color_ambient_occlusion: false,
                animated_textures: false,
                bone_rig: true,
                centered_grid: true,
                rotate_cubes: true,
                integer_size: false,
                meshes: true,
                texture_meshes: false,
                locators: false,
                rotation_limit: false,
                uv_rotation: true,
                java_face_properties: false,
                select_texture_for_particles: false,
                bone_binding_expression: false,
                animation_files: false,
                texture_folder: false,
                image_editor: false,
                edit_mode: true,
                paint_mode: true,
                display_mode: false,
                animation_mode: true,
                pose_mode: false,
                onActivation() {
                    callback = Blockbench.on('update_selection', function (data) {
                        if (shouldMatchTextureSize)
                            updateProjectUV()
                    })
                    EffectAnimator.prototype.channels.particle.name = "N/A"
                    EffectAnimator.prototype.channels.sound.name = "N/A"
                },
                onDeactivation() {
                    callback.delete()
                    EffectAnimator.prototype.channels.particle.name = particle
                    EffectAnimator.prototype.channels.sound.name = sound
                }
            })

        },
        onunload() {
            MenuBar.menus.tools.removeAction('match-texture-size')
            modelFormat.delete()
        }
    });

})()