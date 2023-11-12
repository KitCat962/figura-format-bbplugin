(function () {

	let format

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
	let toggleMatchTextureSize = new Toggle('match_texture_size', {
		name: "Match Project UV with Texture Size",
		default: false,
		description: "Changes the ProjectUV so that it will always match the size of the active Texture.",
		condition: () => Format === format && !Project.box_uv,
		onChange(state) {
			if (state)
				updateProjectUV()
		}
	})

	function isValidLuaIdentifier(str) {
		const keywords = [
			"and",
			"break",
			"do",
			"else",
			"elseif",
			"end",
			"false",
			"for",
			"function",
			"if",
			"in",
			"local",
			"nil",
			"not",
			"or",
			"repeat",
			"return",
			"then",
			"true",
			"until",
			"while",
		]
		return (
			typeof str == "string"
			&& str.search(/^[a-zA-Z0-9_]+$/) !== -1
			&& str.search(/^[0-9]/) === -1
			&& !keywords.includes(str)
		)
	}
	let copyModelPartPath = new Action('figura_copy_path', {
		name: "Copy ModelPart Path",
		description: "Calculates the scripting path to this ModelPart and copies it to the clipboard.",
		icon: "fa-clipboard",
		condition: () => Format === format && Outliner.selected.length === 1,
		click() {
			let path = []
			let element = Outliner.selected[0]
			while (element !== "root") {
				path.unshift(element.name)
				element = element.parent;
			}
			path.unshift(Project.name || "modelName")
			path = path.map(index => isValidLuaIdentifier(index) ? `.${index}` : `["${index}"]`)
			path.unshift('models')
			navigator.clipboard.writeText(path.join(""))
		}
	})

	let cycleVertexOrder = new Action('cycle_vertex_order', {
		name: 'Cycle Vertex Order',
		icon: 'fa-sync',
		category: 'edit',
		condition: { modes: ['edit'], features: ['meshes'], method: () => Format === format && (Mesh.selected[0] && Mesh.selected[0].getSelectedFaces().length) },
		click() {
			Undo.initEdit({ elements: Mesh.selected });
			Mesh.selected.forEach(mesh => {
				for (let key in mesh.faces) {
					let face = mesh.faces[key];
					if (face.isSelected()) {
						if (face.vertices.length < 3) continue;
						[face.vertices[0], face.vertices[1], face.vertices[2], face.vertices[3]] = [face.vertices[1], face.vertices[2], face.vertices[3], face.vertices[0]];
					}
				}
			})
			Undo.finishEdit('Cycle face vertices');
			Canvas.updateView({ elements: Mesh.selected, element_aspects: { geometry: true, uv: true, faces: true } });
		}
	})

	// Stolen from line 92 of timeline_animators.js
	function getOrMakeKeyframe(animator, channel, time, snapping = 24) {
		let before;
		let epsilon = (1 / Math.clamp(snapping, 1, 120)) / 2 || 0.01;

		for (let kf of animator[channel]) {
			if (Math.abs(kf.time - time) <= epsilon) {
				before = kf;
			}
		}
		return before ? before : animator.createKeyframe(null, time, channel, false, false);
	}
	let bakeIkIntoAnimation = new Action('figura_bake_ik', {
		name: "Bake IK into Animations",
		description: "Bakes Inverse Kinematics into raw Keyframes for use in Figura",
		icon: "fa-bone",
		condition: { modes: ['animate'], method: () => /*Format === format &&*/ Animation.selected },
		click() {
			new Dialog({
				id: "figura_confirm_bake_ik",
				title: "Confirm Bake Inverse Kinematics",
				lines: [
					"<p>This bakes the IK of all NullObjects onto the keyframes of the groups themselves, allowing it to be visible in Figura</p>",
					"<p>However, NullObjects <strong>override</strong> the keyframes of the affected groups while it is present</p>",
					"<p>Leaving the NullObject in the model has no effect on Figura, so just leave it incase you want to rebake the IK later</p>"
				],
				form: {
					"all_animations": {
						type: 'checkbox',
						label: 'Bake all Animations?',
						description: "This Action will normally only bake the selected Animation. Do you want to bake all Animations in one swoop?",
						value: false,
						full_width: false
					}
				},
				onConfirm() {
					const animations = this.getFormResult().all_animations ? Animator.animations : [Animation.selected]
					for (const animation of animations) {
						let animators = animation.animators

						// Inverse Kinematics
						let ik_samples = animation.sampleIK();
						for (let uuid in ik_samples) {
							//let group = OutlinerNode.uuids[uuid];
							ik_samples[uuid].forEach((rotation, i) => {
								let timecode = i / animation.snapping
								let kf = getOrMakeKeyframe(animators[uuid], 'rotation', timecode, animation.snapping)
								kf.set('x', rotation.array[0])
								kf.set('y', rotation.array[1])
								kf.set('z', rotation.array[2])
							})
						}
					}
				}
			}).show()
		}
	})

	new ValidatorCheck('figura_mesh_face_rule', {
		update_triggers: ['update_selection'],
		condition: {
			method: (context) => Format === format && Mesh.hasAny()
		},
		run() {
			Mesh.all.forEach(mesh => {
				mesh.forAllFaces(face => {
					if (![3, 4].includes(face.vertices.length)) {
						this.error({
							message: `Mesh ${mesh.name} has invalid face ${face.getFaceKey()} with ${face.vertices.length} vertices`,
							buttons: [{
								name: "Select Mesh",
								icon: "fa-gem",
								click() {
									mesh.select()
									BarItems.selection_mode.change('face')

									// It works best when I select all possible selections, even though I only need to select faces.
									let selectedVertices = mesh.getSelectedVertices(true)
									selectedVertices.empty()
									selectedVertices.push(...face.vertices)

									let selectedEdges = mesh.getSelectedEdges(true)
									selectedEdges.empty()
									for (i = 0; i < face.vertices.length; i++)
										selectedEdges.push([face.vertices[i], face.vertices[(i + 1) % face.vertices.length]])

									let selectedFaces = mesh.getSelectedFaces(true)
									selectedFaces.empty()
									selectedFaces.push(face.getFaceKey())

									// UV Editor for completeness
									UVEditor.vue.selected_faces.empty();
									UVEditor.vue.selected_faces.safePush(face.getFaceKey());
									updateSelection()
									Validator.dialog.hide()
								}
							}]
						})
					}
				})
			})
		}
	})

	BBPlugin.register('figura_format', {
		title: "Figura Model Format",
		author: "Katt (KitCat962)",
		icon: "icon.svg",
		description: "Create models for the Figura mod in a custom format that optimizes Blockbench to work with Figura models.",
		tags: ["Minecraft: Java Edition", "Figura"],
		version: "0.1.1",
		min_version: "4.8.0",
		variant: "both",
		await_loading: true,
		creation_date: "2023-07-22",
		onload() {
			let callback
			let particle = EffectAnimator.prototype.channels.particle, sound = EffectAnimator.prototype.channels.sound
			format = new ModelFormat('figura', {
				icon: 'change_history',
				name: 'Figura Model',
				description: 'Model for the Figura mod.',
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
				locators: true,
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
						if (toggleMatchTextureSize.value)
							updateProjectUV()
					})
					Language.addTranslations('en', {
						['menu.animation.anim_time_update']: "Start Offset",
						['menu.animation.override']: "Override Vanilla Animations",
					})
					delete EffectAnimator.prototype.channels.particle
					delete EffectAnimator.prototype.channels.sound
					EffectAnimator.prototype.channels.timeline.name = "Instruction (Lua Script)"
				},
				onDeactivation() {
					callback.delete()
					Language.addTranslations('en', {
						['menu.animation.anim_time_update']: "Anim Time Update",
						['menu.animation.override']: "Override",
					})
					EffectAnimator.prototype.channels.particle = particle
					EffectAnimator.prototype.channels.sound = sound
					EffectAnimator.prototype.channels.timeline.name = tl('timeline.timeline')
				}
			})

			Cube.prototype.menu.addAction(copyModelPartPath, '#manage');
			Mesh.prototype.menu.addAction(copyModelPartPath, '#manage');
			Group.prototype.menu.addAction(copyModelPartPath, '#manage');
			MenuBar.menus.edit.addAction(toggleMatchTextureSize, '#editing_mode')
			MenuBar.menus.animation.addAction(bakeIkIntoAnimation, '#edit')
			Toolbars.main_tools.add(cycleVertexOrder)

			// Remove the Texture Render Mode field from the Right Click context menu.
			Texture.prototype.menu.structure.find(v => v.name == 'menu.texture.render_mode').condition = () => Format !== format
			// Removed the Render Order field from the Right Click context menu.
			let elementRenderOrderCondition = BarItems.element_render_order.condition
			BarItems.element_render_order.condition = () => Format === format ? false : elementRenderOrderCondition()

			// Remove molang validation, as Figura uses Lua not molang
			let molangSyntax = Validator.checks.find(element => element.id == 'molang_syntax')
			if (molangSyntax) {
				let method = molangSyntax.condition.method
				molangSyntax.condition.method = (context) => Format === format ? false : (method ? method(context) : false)
			}

			// Change the default name of new Animations from `animation.model.new` to just `new`
			let addAnimationClick = BarItems['add_animation'].click
			BarItems['add_animation'].click = function () {
				if (Format !== format) addAnimationClick.call(this)
				else
					new Animation({
						name: 'new',
						saved: false
					}).add(true).propertiesDialog()
			}
			// Add a popup when clicking on Export Textures to notify new users
			let exportAnimationClick = BarItems['export_animation_file'].click
			BarItems['export_animation_file'].click = function (...args) {
				let button = this
				if (Format !== format) {
					exportAnimationClick.call(button, ...args)
					return
				}
				new Dialog({
					id: "figura_confirm_export_animation",
					title: "Confirm Export Animations",
					lines: [
						"<p><strong>Figura does not read these exported Animation files.</strong></p>",
						"<p>Figura reads animations directly from the Blockbench file itself.</p>",
						"<p>The Export Animmations button should only be used when transfering animations from one bbmodel to another.</p>",
						"<p>Otherwise, do not touch this button.</p>",
						"<p>Do you understand, and want the exported animations anyways?</p>"
					],
					onConfirm() {
						exportAnimationClick.call(button, ...args)
					}
				}).show()
			}

			// In the Texture Properties Dialog specifically, remove the Render Mode field
			let DialogBuild = Dialog.prototype.build
			Dialog.prototype.build = function () {
				if (Format === format && this.id == 'texture_edit') delete this.form.render_mode
				DialogBuild.call(this)
			}

			// Prevents the Timeline from erroring when Sound and Particle channels are removed
			let displayFrame = EffectAnimator.prototype.displayFrame
			EffectAnimator.prototype.displayFrame = function () {
				if (Format === format) return
				displayFrame.call(this)
			}
		},
		onunload() {
			MenuBar.menus.tools.removeAction('match_texture_size')
			Toolbars.main_tools.remove('cycle_vertex_order')
			format.delete()
		}
	});

})()