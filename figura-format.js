(function () {

    let modelFormat
    let callback
    let shouldMatchTextureSize = false
    let toggleMatchTextureSize = new Toggle('match-texture-size', {
        name: "Match Project UV with Texture Size",
        default: false,
        description: "Changes the ProjectUV so that it will always match the size of the active Texture.",
        onChange(state) {
            shouldMatchTextureSize = state
            if (state)
                updateProjectUV()
        }
    })
    let _width = 0, _height = 0
    function updateProjectUV() {
        let texture = UVEditor.texture != 0 ? UVEditor.texture : Texture.selected
        if (texture != null && (texture.width != _width || texture.height != _height)) {
            setProjectResolution(1, 1, true)
            setProjectResolution(texture.width, texture.height, true)
            _width = texture.width, _height = texture.height
        }
    }

    BBPlugin.register('figura-format', {
        title: 'Figura Model Format',
        author: 'KitCat962',
        icon: 'change_history',
        description: 'A custom Model Format for use with the Figura mod, stripping Blockbench features that are incompatible.',
        version: '0.0.1',
        min_version: '4.7.0',
        tags: ['Minecraft: Java Edition', 'Figura'],
        variant: 'both',
        await_loading: true,
        onload() {
            MenuBar.menus.uv.addAction(toggleMatchTextureSize)
            callback = Blockbench.on('update_selection', function (data) {
                if (shouldMatchTextureSize)
                    updateProjectUV()
            })
            modelFormat = new ModelFormat('figura', {
                icon: 'change_history',
                name: 'Figura',
                description: 'Generic Format clone that removes features that Figura does not support.',
                category: 'low_poly',
                show_on_start_screen: true,
                box_uv: false,
                optional_box_uv: false,
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
                },
                onDeactivation() {
                }
            })
        },
        onunload() {
            MenuBar.menus.uv.removeAction('match-texture')
            callback.delete()
            modelFormat.delete()
        }
    });

})()