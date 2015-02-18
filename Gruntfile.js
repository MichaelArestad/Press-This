module.exports = function( grunt ) {
	require( 'matchdep' ).filterDev( 'grunt-*' ).forEach( grunt.loadNpmTasks );

	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),
		sass: {
			dist: {
				options: {
					// Can be nested, compact, compressed, expanded
					style: 'expanded'
				},
				files: {
					'css/press-this.css': 'scss/style.scss',
					'css/press-this-editor.css': 'scss/editor-style.scss'
				}
			}
		},
		autoprefixer: {
			global: {
				options: {
					// Target-specific options go here.
					// browser-specific info: https://github.com/ai/autoprefixer#browsers
					// DEFAULT: browsers: ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1']
					browsers: [ '> 1%', 'last 2 versions', 'ff 17', 'opera 12.1', 'ie 8', 'ie 9' ]
				},
				src: [
					'css/press-this.css',
					'css/press-this-editor.css'
				]
			}
		},
		jshint: {
			options: grunt.file.readJSON( '.jshintrc' ),
			grunt: {
				options: {
					node: true
				},
				src: [ 'Gruntfile.js' ]
			},
			plugin: {
				src: [ 'js/**/*.js' ]
			}
		},
		watch: {
			css: {
				files: [ 'scss/*.scss', 'scss/**/*.scss' ],
				tasks: [ 'sass', 'autoprefixer' ],
				options: {
					spawn: false
				}
			}
		}
	} );

	grunt.registerTask( 'default', [ 'watch' ] );
};
