module.exports = function(grunt) {

// 1. All configuration goes here
grunt.initConfig({
  pkg: grunt.file.readJSON('package.json'),

  sass: {
    dist: {
      options: {
        // Can be nested, compact, compressed, expanded
        style: 'expanded'
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
        cwd: 'images/icons/.tmp-fallbacks/',
        src: [ '*.svg' ],
        dest: "images/icons/"
      }],
      options: {
        defaultWidth: '20px',
        defaultHeight: '20px',
        colors: {
          white: "#ffffff"
        }
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
      files: [{
        expand: true,
        cwd: 'images/icons/src/',
        src: [ '*.svg' ],
        dest: 'images/icons/.tmp',
        ext: '.svg'
      }]
    },
    fallbacks: {
      files: [{
        expand: true,
        cwd: 'images/icons/src/',
        src: [ '*.svg' ],
        dest: 'images/icons/.tmp-fallbacks',
        ext: '.colors-white.svg'
      }]
    }
  },

  svgstore: {
    defaults: {
      options: {
        prefix : 'dashicons-',
        svg: {
          viewBox : '0 0 20 20',
          class : 'dashicons-bundle'
        }
      },
      files: {
        'images/icons/dashicons.svg': [ 'images/icons/.tmp/*.svg' ]
      },
    }
  },

  watch: {
    css: {
      files: ['scss/*.scss', 'scss/**/*.scss'],
      tasks: ['sass', 'autoprefixer'],
      options: {
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
grunt.loadNpmTasks('grunt-contrib-watch');      // watch files for changes
grunt.loadNpmTasks('grunt-contrib-sass');       // Gettin Sassy!
grunt.loadNpmTasks('grunt-autoprefixer');       // Auto-freaking-prefixer!!!
grunt.loadNpmTasks('grunt-grunticon');          // Grunticon!
grunt.loadNpmTasks( 'grunt-svgmin' );           // SVG minifier
grunt.loadNpmTasks('grunt-svgstore');           // SVG combiner

// 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
grunt.registerTask('default', ['watch']);

};
