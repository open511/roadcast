module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		dest: 'dist',

		concat: {
			main: {
				files: {
					'<%=dest%>/js/open511-viewer.js': [
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
						'<%=dest%>/js/templates.js'
					],
					'<%=dest%>/js/map-adapter-leaflet.js': ['app/js/map-leaflet.js'],
					'<%=dest%>/js/map-adapter-google.js': ['app/js/map-google.js', 'app/js/geojson-to-google.js'],
					'<%=dest%>/js/open511-editor.js': [
						'app/js/editor/editor.js',
						'app/js/editor/widgets/map.js',
						'app/js/editor/widgets/roads.js',
						'app/js/editor/widgets/attachments.js',
						'app/js/plugins/publish-events.js',
						'<%=dest%>/js/templates-editor.js'
					],

					'<%=dest%>/js/libs-main.js': [
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
					'<%=dest%>/js/libs-editor.js': [
						'app/vendor/jquery/jquery.ui.widget.js',
						'app/vendor/fileupload/iframe-transport.js',
						'app/vendor/fileupload/jquery.fileupload.js'
					],
					'<%=dest%>/js/libs-all-googlemaps.js': [
						'<%=dest%>/js/libs-main.js',
						'<%=dest%>/js/libs-editor.js'
					],
					'<%=dest%>/js/libs-all-leaflet.js': [
						'<%=dest%>/js/libs-all-googlemaps.js',
						'app/vendor/leaflet/leaflet.js',
						'app/js/leaflet.draw.js'
					],

					'<%=dest%>/locale/fr.js': [
						'app/vendor/jed.js',
						'app/i18n/fr.js'
					],

					'<%=dest%>/css/main.css': ['app/css/index.css'],
					'<%=dest%>/css/editor.css': ['app/css/editor.css'],
					'<%=dest%>/css/libs.css': [
						'app/vendor/bootstrap/css/bootstrap.css',
						'app/vendor/datepicker.css'
					],
					'<%=dest%>/css/leaflet.css': [
						'app/vendor/leaflet/leaflet.css',
						'app/vendor/leaflet/leaflet.draw.css'
					],

					'<%=dest%>/js/open511-complete-leaflet.js': [
						'<%=dest%>/js/libs-all-leaflet.js',
						'<%=dest%>/js/open511-viewer.js',
						'<%=dest%>/js/open511-editor.js',
						'<%=dest%>/js/map-adapter-leaflet.js'
					],
					'<%=dest%>/js/open511-complete-googlemaps.js': [
						'<%=dest%>/js/libs-all-googlemaps.js',
						'<%=dest%>/js/open511-viewer.js',
						'<%=dest%>/js/open511-editor.js',
						'<%=dest%>/js/map-adapter-google.js'
					],

					'<%=dest%>/example.html': ['app/example.html']
				}
			}
		},

		copy: {
			main: {
				files: [{
					expand: true,
					flatten: true,
					src: ['app/img/*', 'app/vendor/bootstrap/img/*'],
					dest: '<%=dest%>/img/'
				}]
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
				dest: '<%=dest%>/js/templates.js'
			},
			editor: {
				src: ['app/jst/editor/*.html'],
				dest: '<%=dest%>/js/templates-editor.js'
			}
		},

		uglify: {
			main: {
				files: {
					'<%=dest%>/js/open511-complete-leaflet.min.js': ['<%=dest%>/js/open511-complete-leaflet.js'],
					'<%=dest%>/js/open511-complete-googlemaps.min.js': ['<%=dest%>/js/open511-complete-googlemaps.js'],

					'<%=dest%>/locale/fr.js': ['<%=dest%>/locale/fr.js']
				}
			}
		},

		cssmin: {
			main: {
				files: {
					'<%=dest%>/css/open511-complete-googlemaps.css': [
						'<%=dest%>/css/main.css',
						'<%=dest%>/css/editor.css',
						'<%=dest%>/css/libs.css'
					],
					'<%=dest%>/css/open511-complete-leaflet.css': [
						'<%=dest%>/css/open511-complete-googlemaps.css',
						'<%=dest%>/css/leaflet.css'
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
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('assemble', ['clean', 'jst', 'concat', 'copy', 'cssmin']);
	grunt.registerTask('default', ['assemble', 'uglify']);
	grunt.registerTask('python-build', function() {
		grunt.config('dest', 'django_open511_ui/static/o5ui');
		grunt.task.run('default');
	});
	// grunt.registerTask('python-watch', function() {
	// 	grunt.config('dest', 'django_open511_ui/static/o5ui');
	// 	grunt.task.run('watch');
	// });

};