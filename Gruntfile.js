module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			main: {
				files: {
					'dist/app/open511-viewer.js': [
						'app/js/no-i18n.js',
						'app/js/main.js',
						'app/js/layout.js',
						'app/js/roadevent.js',
						'app/js/eventdetail.js',
						'app/js/roadevent.js',
						'app/js/router.js',
						'app/js/listview.js',
						'app/js/map-base.js',
						'app/js/filterset.js',
						'app/js/filterwidget.js',
						'app/js/widgets.js',
						'app/js/utils.js',
						'dist/app/templates.js'
					],
					'dist/app/map-adapter-leaflet.js': ['app/js/map-leaflet.js'],
					'dist/app/map-adapter-google.js': ['app/js/map-google.js', 'app/js/geojson-to-google.js'],
					'dist/app/open511-editor.js': [
						'app/js/editor/editor.js',
						'app/js/editor/widgets/map.js',
						'app/js/editor/widgets/roads.js',
						'app/js/editor/widgets/attachments.js',
						'app/js/plugins/publish-events.js',
						'dist/app/templates-editor.js'
					],

					'dist/libs/main.js': [
						'app/vendor/jquery.js',
						'app/vendor/lodash.js',
						'app/vendor/backbone.js',
						'app/vendor/bootstrap/js/bootstrap-alert.js',
						'app/vendor/bootstrap/js/bootstrap-transition.js',
						'app/vendor/bootstrap/js/bootstrap-dropdown.js',
						'app/vendor/bootstrap/js/bootstrap-button.js',
						'app/vendor/bootstrap/js/bootstrap-modal.js',
						'app/vendor/datepicker.js'
					],
					'dist/libs/editor.js': [
						'app/vendor/jquery/jquery.ui.widget.js',
						'app/vendor/fileupload/iframe-transport.js',
						'app/vendor/fileupload/jquery.fileupload.js'
					],
					'dist/libs/all-googlemaps.js': [
						'dist/libs/main.js',
						'dist/libs/editor.js'
					],
					'dist/libs/all-leafletmaps.js': [
						'dist/libs/all-googlemaps.js',
						'app/vendor/leaflet/leaflet.js',
						'app/js/leaflet.draw.js'
					],

					'dist/locale/fr.js': [
						'app/vendor/jed.js',
						'app/i18n/fr.js'
					],

					'dist/app/main.css': ['app/css/index.css'],
					'dist/app/editor.css': ['app/css/editor.css'],
					'dist/libs/libs.css': [
						'app/vendor/bootstrap/css/bootstrap.css',
						'app/vendor/datepicker.css'
					],
					'dist/libs/leaflet.css': [
						'app/vendor/leaflet/leaflet.css',
						'app/vendor/leaflet/leaflet.draw.css'
					],

					'dist/open511-complete-leaflet.js': [
						'dist/libs/all-leafletmaps.js',
						'dist/app/open511-viewer.js',
						'dist/app/open511-editor.js',
						'dist/app/map-adapter-leaflet.js'
					],
					'dist/open511-complete-googlemaps.js': [
						'dist/libs/all-googlemaps.js',
						'dist/app/open511-viewer.js',
						'dist/app/open511-editor.js',
						'dist/app/map-adapter-google.js'
					],

					'dist/example.html': ['app/example.html']
				}
			}
		},

		jst: {
			options: {
				processName: function(fn) {
					return fn.split('/').pop().replace('.html', '');
				}
			},
			viewer: {
				src: ['app/jst/*.html'],
				dest: 'dist/app/templates.js'
			},
			editor: {
				src: ['app/jst/editor/*.html'],
				dest: 'dist/app/templates-editor.js'
			}
		},

		uglify: {
			main: {
				files: {
					'dist/open511-complete-leaflet.min.js': ['dist/open511-complete-leaflet.js'],
					'dist/open511-complete-googlemaps.min.js': ['dist/open511-complete-googlemaps.js'],

					'dist/locale/fr.js': ['dist/locale/fr.js']
				}
			}
		},

		cssmin: {
			main: {
				files: {
					'dist/open511-complete-googlemaps.css': [
						'dist/app/main.css',
						'dist/app/editor.css',
						'dist/libs/libs.css'
					],
					'dist/open511-complete-leaflet.css': [
						'dist/open511-complete-googlemaps.css',
						'dist/libs/leaflet.css'
					]
				}
			}
		},

		clean: ['dist/'],

		watch: {
			files: ['app/**/*'],
			tasks: ['assemble']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jst');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('assemble', ['clean', 'jst', 'concat', 'cssmin'])
	grunt.registerTask('default', ['assemble', 'uglify']);

};