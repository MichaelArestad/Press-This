module.exports = function(grunt) {

    // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // concat: {
        //     dist: {
        //         src: [
        //             'js/main/*.js',
        //         ],
        //         dest: 'js/production.js', // needs a better name, doncha think?
        //     }
        // },
        // uglify: {
        //     build: {
        //         src: 'js/production.js',
        //         dest: 'js/production.min.js'
        //     }
        // },
        sass: {
            dist: {
                options: {
                    // Can be nested, compact, compressed, expanded
                    style: 'expanded',
                    require: 'susy',
                    sourcemap: true
                },
                files: {
                    'css/press-this.css': 'scss/style.scss'
                }
            }
        },
        autoprefixer: {
            options: {
                // Task-specific options go here.
            },
            global: {
                options: {
                    // Target-specific options go here.
                    // browser-specific info: https://github.com/ai/autoprefixer#browsers
                    // DEFAULT: browsers: ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1']
                    browsers: ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1', 'ie 8', 'ie 9']
                },
                src: 'css/press-this.css'
            },
        },
        grunticon: {
            dashicons: {
                files: [{
                    expand: true,
                    cwd: 'images/icons/',
                    src: ['*.svg', '*.png'],
                    dest: "images/icons/"
                }],
                options: {
                    defaultWidth: '20px',
                    defaultHeight: '20px'
                }
            }
        },
        svgmin: {
            options: {
                plugins: [
                    { removeViewBox: false },
                    { removeUselessStrokeAndFill: false }
                ]
            },
            dist: {
                files: [{               // Dictionary of files
                    expand: true,       // Enable dynamic expansion.
                    cwd: 'images/icons',     // Src matches are relative to this path.
                    src: ['*.svg'],  // Actual pattern(s) to match.
                    dest: 'images/icons',       // Destination path prefix.
                    ext: '.svg'     // Dest filepaths will have this extension.
                    // ie: optimise img/src/branding/logo.svg and store it in img/branding/logo.min.svg
                }]
            }
        },
        svgstore: {
            defaults: {
                options: {
                    prefix : 'dashicons-', // This will prefix each ID
                    svg: { // will be added as attributes to the resulting SVG
                        viewBox : '0 0 20 20'
                    }
                },
                files: {
                    'images/icons/icons.svg': ['images/icons/*.svg']
                },
            }
        },
        watch: {
            // options: {
            //     livereload: true,
            // },
            // scripts: {
            //     files: ['js/*.js'],
            //     tasks: ['concat', 'uglify'],
            //     options: {
            //         spawn: false,
            //     },
            // },
            css: {
                files: ['scss/*.scss', 'scss/**/*.scss'],
                tasks: ['sass'],
                options: {
                    spawn: false,
                }
            },
            autoprefixer: {
                files: ['css/*.css', 'css/**/*.css'],
                tasks: ['autoprefixer'],
                options: {
                    livereload: true,
                    spawn: false,
                }
            },
            svg: {
                files: ['images/icons/*.svg'],
                tasks: ['svgmin', 'svgstore', 'grunticon'],
                options: {
                    spawn: false,
                }
            }
        }
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-concat');     // concatenate
    grunt.loadNpmTasks('grunt-contrib-uglify');     // minify
    grunt.loadNpmTasks('grunt-contrib-watch');      // watch files for changes
    grunt.loadNpmTasks('grunt-contrib-sass');       // Gettin Sassy!
    grunt.loadNpmTasks('grunt-autoprefixer');       // Auto-freaking-prefixer!!!
    grunt.loadNpmTasks('grunt-grunticon');          // Grunticon!
    grunt.loadNpmTasks( 'grunt-svgmin' );           // SVG minifier
    grunt.loadNpmTasks('grunt-svgstore');           // SVG combiner

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['watch']);

};
