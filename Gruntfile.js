module.exports = function( grunt ) {
	require( 'matchdep' ).filterDev( 'grunt-*' ).forEach( grunt.loadNpmTasks );

	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),
		autoprefixer: {
			options: {
				browsers: [ 'Android >= 2.1', 'Chrome >= 21', 'Explorer >= 7', 'Firefox >= 17', 'Opera >= 12.1', 'Safari >= 6.0' ],
				cascade: false
			},
			global: {
				src: [
					'css/press-this.css',
					'css/press-this-editor.css'
				]
			}
		},
		githooks: {
			all: {
				'pre-commit': 'precommit'
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
				src: [ 'js/**/*.js', '!js/**/*.min.js' ]
			}
		},
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
		uglify: {
			bookmarklet: {
				options: {
					compress: {
						negate_iife: false
					}
				},
				files: {
					'js/bookmarklet.min.js': [ 'js/bookmarklet.js' ]
				}
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

	grunt.registerTask( 'default', [
		'watch'
	] );

	grunt.registerTask( 'precommit', [
		'autoprefixer',
		'jshint',
		'uglify'
	] );
};
