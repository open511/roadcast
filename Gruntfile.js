module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			main: {
				files: {
					'<%=dest%>/js/open511-viewer-app.js': [
						'app/js/i18n.js',
						'app/js/datepicker.js',
						'app/js/main.js',
						'app/js/views.js',
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
					'<%=dest%>/js/plugins/open511-editor.js': [
						'app/js/editor/editor.js',
						'app/js/editor/widgets/map.js',
						'app/js/editor/widgets/roads.js',
						'<%=dest%>/js/templates-editor.js',
					],

					'<%=dest%>/js/plugins/attachments.js': [
						'app/vendor/jquery/jquery.ui.widget.js',
						'app/vendor/fileupload/iframe-transport.js',
						'app/vendor/fileupload/jquery.fileupload.js',
						'app/js/editor/widgets/attachments.js'
					],

					'<%=dest%>/js/dependencies.js': [
						'app/vendor/jquery.js',
						'app/vendor/lodash.js',
						'app/vendor/backbone.js',
						'app/vendor/moment.js'
					],

					'<%=dest%>/js/dependencies-leaflet.js': [
						'<%=dest%>/js/dependencies.js',
						'app/vendor/leaflet/leaflet.js',
						'app/js/leaflet.draw.js',
						'app/vendor/leaflet/leaflet.markercluster.js'
					],

					'<%=dest%>/locale/fr.js': [
						'app/vendor/jed.js',
						'app/i18n/fr.js',
						'app/i18n/fr-dates.js'
					],

					'<%=dest%>/css/main.css': [
						'app/css/formfields.css',
						'app/css/datepicker-custom.css',
						'app/css/open511.css',
						'app/css/markers.css'
					],
					'<%=dest%>/css/editor.css': ['app/css/editor.css'],
					'<%=dest%>/css/libs.css': [
						'app/vendor/datepicker.css'
					],
					'<%=dest%>/css/leaflet.css': [
						'app/vendor/leaflet/leaflet.css',
						'app/vendor/leaflet/leaflet.draw.css',
						'app/vendor/leaflet/leaflet.markercluster.css'
					],

					'<%=dest%>/js/open511-leaflet.js': [
						'<%=dest%>/js/dependencies-leaflet.js',
						'<%=dest%>/js/open511-viewer-app.js',
						'<%=dest%>/js/map-adapter-leaflet.js'
					],

					'<%=dest%>/js/open511-googlemaps.js': [
						'<%=dest%>/js/dependencies.js',
						'<%=dest%>js/open511-viewer-app.js',
						'<%=dest%>js/map-adapter-google.js'
					],

					'<%=dest%>/example.html': ['app/example.html']
				}
			}
		},

		copy: {
			main: {
				files: [{
					src: ['app/img/*', 'app/vendor/bootstrap/img/*'],
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
				}]
			}
		},

		jst: {
			// FIXME to temporary directory?
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
				files: [{
					expand: true,
					cwd: '<%=dest%>/js/',
					src: ['open511-leaflet.js', 'open511-googlemaps.js', 'plugins/*.js'],
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
					'<%=dest%>/css/open511-complete-googlemaps.css': [
						'<%=dest%>/css/libs.css',
						'<%=dest%>/css/main.css',
						'<%=dest%>/css/editor.css'
					],
					'<%=dest%>/css/open511-complete-leaflet.css': [
						'<%=dest%>/css/leaflet.css',
						'<%=dest%>/css/open511-complete-googlemaps.css'
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

		clean: ['<%=dest%>/'],

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

	grunt.registerTask('assemble', ['clean', 'jst', 'concat', 'copy', 'cssmin']);
	grunt.registerTask('default', ['assemble', 'uglify']);

};