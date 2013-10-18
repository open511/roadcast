module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			main: {
				files: {
					'<%=dest%>/js/open511-nodeps.js': [
						'app/js/i18n.js',
						'app/js/main.js',
						'app/js/views.js',
						'app/js/layout.js',
						'app/js/roadevent.js',
						'app/js/schedule.js',
						'app/js/eventdetail.js',
						'app/js/router.js',
						'app/js/listview.js',
						'app/js/map/map-base.js',
						'app/js/filterset.js',
						'app/js/filterwidget.js',
						'app/js/widgets.js',
						'app/js/utils/utils.js',
						'<%=dest%>/tmp/templates.js'
					],
					'<%=dest%>/js/open511.js': [
						'app/vendor/jquery.js',
						'app/vendor/lodash.js',
						'app/vendor/backbone.js',
						'app/vendor/moment.js',
						'app/vendor/datepicker.js',
						'app/vendor/jquery.easymodal.js',
						'<%=dest%>/js/open511-nodeps.js'
					],
					'<%=dest%>/js/open511-maps.js': [
						'app/vendor/leaflet/leaflet.js',
						'app/js/map/leaflet.draw.js',
						'app/vendor/leaflet/leaflet.markercluster.js',
						'app/js/map/map-leaflet.js'
					],
					'<%=dest%>/js/open511-googlemaps.js': [
						'app/js/map/map-google.js',
						'app/js/map/geojson-to-google.js'
					],

					'<%=dest%>/js/plugins/open511-editor.js': [
						'app/js/editor/editor.js',
						'app/js/editor/fieldgroup.js',
						'app/js/editor/widgets/map.js',
						'app/js/editor/widgets/timerange.js',
						'app/js/editor/widgets/schedule.js',
						'<%=dest%>/tmp/templates-editor.js'
					],
					'<%=dest%>/js/plugins/attachments.js': [
						'app/vendor/jquery/jquery.ui.widget.js',
						'app/vendor/fileupload/iframe-transport.js',
						'app/vendor/fileupload/jquery.fileupload.js',
						'app/js/editor/widgets/attachments.js'
					],

					'<%=dest%>/locale/fr.js': [
						//'app/vendor/jed.js',
						'app/i18n/simple-i18n.js',
						'app/i18n/fr.js',
						'app/i18n/fr-dates.js'
					],

					// '<%=dest%>/css/main.css': [
					// 	'app/css/formfields.css',
					// 	'app/css/datepicker-custom.css',
					// 	'app/css/open511.css',
					// 	'app/css/markers.css'
					// ],
					// '<%=dest%>/css/editor.css': ['app/css/editor.css'],
					// '<%=dest%>/css/libs.css': [
					// 	'app/vendor/datepicker.css'
					// ],
					// '<%=dest%>/css/leaflet.css': [
					// 	'app/vendor/leaflet/leaflet.css',
					// 	'app/vendor/leaflet/leaflet.draw.css',
					// 	'app/vendor/leaflet/leaflet.markercluster.css'
					// ],

				}
			}
		},

		copy: {
			main: {
				files: [{
					src: ['app/img/*'],
					dest: '<%=dest%>/img/',
					expand: true,
					flatten: true
				},
				{
					src: ['app/fonts/*'],
					dest: '<%=dest%>/fonts/',
					expand: true,
					flatten: true
				},
				{
					src: ['app/js/plugins/*.js'],
					dest: '<%=dest%>/js/plugins/',
					expand: true,
					flatten: true
				},
				{
					src: ['app/*.html'],
					dest: '<%=dest%>/',
					expand: true,
					flatten: true
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
				dest: '<%=dest%>/tmp/templates.js'
			},
			editor: {
				src: ['app/jst/editor/*.html'],
				dest: '<%=dest%>/tmp/templates-editor.js'
			}
		},

		uglify: {
			main: {
				// options: {
				// 	sourceMap: function(m) { return m + '.sourcemap'; }
				// },
				files: [{
					expand: true,
					cwd: '<%=dest%>/js/',
					src: ['*.js', 'plugins/*.js'],
					dest: '<%=dest%>/js/',
					ext: '.min.js'
				},
				{
					expand: true,
					cwd: '<%=dest%>/locale/',
					src: ['??.js'],
					dest: '<%=dest%>/locale/'
				}]
			}
		},

		cssmin: {
			main: {
				files: {
					'<%=dest%>/css/open511.css': [
						// dependencies
						'app/vendor/datepicker.css',

						// leaflet
						'app/vendor/leaflet/leaflet.css',
						'app/vendor/leaflet/leaflet.draw.css',
						'app/vendor/leaflet/leaflet.markercluster.css',

						// app CSS
						'app/css/formfields.css',
						'app/css/datepicker-custom.css',
						'app/css/open511.css',
						'app/css/markers.css',

						'app/css/small-screen.css',

						// editor
						'app/css/editor.css',

					],
					'<%=dest%>/css/open511-ie.css': [
						'app/vendor/leaflet/leaflet.ie.css'
					]
				}
			}
		},

		autoprefixer: {
			options: {
				browsers: ['last 3 versions', 'ie 8', 'ie 9']
			},
			main: {
				files : [{
					expand: true,
					cwd: '<%=dest %>/css/',
					src: '*.css',
					dest: '<%=dest%>/css/'
				}]
			}
		},

		clean: {
			prebuild: ['<%=dest%>/'],
			postbuild: ['<%=dest%>/tmp/']
		},

		watch: {
			files: ['app/**/*'],
			tasks: ['assemble']
		}
	});

	if (grunt.option('target') === 'python') {
		grunt.config('dest', 'django_open511_ui/static/o5ui');
	}
	else {
		grunt.config('dest', 'dist');
	}

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jst');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-autoprefixer');

	grunt.registerTask('assemble', ['clean:prebuild', 'jst', 'concat', 'copy', 'cssmin', 'clean:postbuild']);
	grunt.registerTask('default', ['assemble', 'uglify']);

};