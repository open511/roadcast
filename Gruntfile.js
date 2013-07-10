module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		dest: 'dist',

		concat: {
			main: {
				files: {
					'<%=dest%>/app/open511-viewer.js': [
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
						'<%=dest%>/app/templates.js'
					],
					'<%=dest%>/app/map-adapter-leaflet.js': ['app/js/map-leaflet.js'],
					'<%=dest%>/app/map-adapter-google.js': ['app/js/map-google.js', 'app/js/geojson-to-google.js'],
					'<%=dest%>/app/open511-editor.js': [
						'app/js/editor/editor.js',
						'app/js/editor/widgets/map.js',
						'app/js/editor/widgets/roads.js',
						'app/js/editor/widgets/attachments.js',
						'app/js/plugins/publish-events.js',
						'<%=dest%>/app/templates-editor.js'
					],

					'<%=dest%>/libs/main.js': [
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
					'<%=dest%>/libs/editor.js': [
						'app/vendor/jquery/jquery.ui.widget.js',
						'app/vendor/fileupload/iframe-transport.js',
						'app/vendor/fileupload/jquery.fileupload.js'
					],
					'<%=dest%>/libs/all-googlemaps.js': [
						'<%=dest%>/libs/main.js',
						'<%=dest%>/libs/editor.js'
					],
					'<%=dest%>/libs/all-leafletmaps.js': [
						'<%=dest%>/libs/all-googlemaps.js',
						'app/vendor/leaflet/leaflet.js',
						'app/js/leaflet.draw.js'
					],

					'<%=dest%>/locale/fr.js': [
						'app/vendor/jed.js',
						'app/i18n/fr.js'
					],

					'<%=dest%>/app/main.css': ['app/css/index.css'],
					'<%=dest%>/app/editor.css': ['app/css/editor.css'],
					'<%=dest%>/libs/libs.css': [
						'app/vendor/bootstrap/css/bootstrap.css',
						'app/vendor/datepicker.css'
					],
					'<%=dest%>/libs/leaflet.css': [
						'app/vendor/leaflet/leaflet.css',
						'app/vendor/leaflet/leaflet.draw.css'
					],

					'<%=dest%>/open511-complete-leaflet.js': [
						'<%=dest%>/libs/all-leafletmaps.js',
						'<%=dest%>/app/open511-viewer.js',
						'<%=dest%>/app/open511-editor.js',
						'<%=dest%>/app/map-adapter-leaflet.js'
					],
					'<%=dest%>/open511-complete-googlemaps.js': [
						'<%=dest%>/libs/all-googlemaps.js',
						'<%=dest%>/app/open511-viewer.js',
						'<%=dest%>/app/open511-editor.js',
						'<%=dest%>/app/map-adapter-google.js'
					],

					'<%=dest%>/example.html': ['app/example.html']
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
				dest: '<%=dest%>/app/templates.js'
			},
			editor: {
				src: ['app/jst/editor/*.html'],
				dest: '<%=dest%>/app/templates-editor.js'
			}
		},

		uglify: {
			main: {
				files: {
					'<%=dest%>/open511-complete-leaflet.min.js': ['<%=dest%>/open511-complete-leaflet.js'],
					'<%=dest%>/open511-complete-googlemaps.min.js': ['<%=dest%>/open511-complete-googlemaps.js'],

					'<%=dest%>/locale/fr.js': ['<%=dest%>/locale/fr.js']
				}
			}
		},

		cssmin: {
			main: {
				files: {
					'<%=dest%>/open511-complete-googlemaps.css': [
						'<%=dest%>/app/main.css',
						'<%=dest%>/app/editor.css',
						'<%=dest%>/libs/libs.css'
					],
					'<%=dest%>/open511-complete-leaflet.css': [
						'<%=dest%>/open511-complete-googlemaps.css',
						'<%=dest%>/libs/leaflet.css'
					]
				}
			}
		},

		clean: ['<%=dest%>/'],

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

	grunt.registerTask('assemble', ['clean', 'jst', 'concat', 'cssmin']);
	grunt.registerTask('default', ['assemble', 'uglify']);
	grunt.registerTask('python-build', function() {
		grunt.config('dest', 'open511_ui/static');
		grunt.task.run('default');
	});

};