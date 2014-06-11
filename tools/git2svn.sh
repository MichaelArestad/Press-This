#!/bin/bash

# args
CHECKOUT_DIR=${1-'~/svn/wp-plugins/'}
BRANCH='trunk'

if [ ! -d $CHECKOUT_DIR ]; then
	echo "$SRC_DIR doesn't seem to exist."
	exit
fi

# paths
SRC_DIR=$(git rev-parse --show-toplevel)
DIR_NAME=$(basename $SRC_DIR)
SVN_URL="https://plugins.svn.wordpress.org/$DIR_NAME"
SVN_DIR=$CHECKOUT_DIR/$DIR_NAME
DEST_DIR=$SVN_DIR/$BRANCH
ASSETS_DIR=$SVN_DIR/assets
VERSION=$(cat $SRC_DIR/press-this.php | grep 'Version: ' | cut -d ' ' -f 2)

cd $SRC_DIR

# Tag Git release with plugin version
git tag $VERSION
git push
git push --tags

# make sure we're deploying from the right dir
if [ ! -d "$SRC_DIR/.git" ]; then
	echo "$SRC_DIR doesn't seem to be a git repository"
	exit
fi

# checkout or update the plugin svn repo locally
if [ ! -d $SVN_DIR ]; then
	svn co $SVN_URL $SVN_DIR
else
	svn up $SVN_DIR
fi

# make sure the destination dir exists
svn mkdir $DEST_DIR 2> /dev/null
svn add $DEST_DIR 2> /dev/null

# delete everything except .svn dirs
for file in $(find $DEST_DIR/* -not -path "*.svn*")
do
	rm $file 2>/dev/null
done

# copy everything over from git
rsync -r --exclude='*.git*' $SRC_DIR/* $DEST_DIR

cd $DEST_DIR

# check .gitignore, delete related files
for file in $(cat "$SRC_DIR/.gitignore" 2>/dev/null); do
	rm -rf $file
done

# delete readme.md, readme.txt has diff info and points to it on Github
rm $(find $DEST_DIR -iname 'README.m*')

# Moves ./assets/* to ../assets/
mv $DEST_DIR/assets/* $ASSETS_DIR/
rm -rf $DEST_DIR/assets

# svn addremove in $ASSETS_DIR
cd $ASSETS_DIR
svn stat | grep '^\?' | awk '{print $2}' | xargs svn add > /dev/null 2>&1
svn stat | grep '^\!' | awk '{print $2}' | xargs svn rm  > /dev/null 2>&1

svn stat

svn ci -m "Releasing version $VERSION from https://github.com/MichaelArestad/Press-This/tree/master"

# svn addremove in #DEST_DIR
cd $DEST_DIR
svn stat | grep '^\?' | awk '{print $2}' | xargs svn add > /dev/null 2>&1
svn stat | grep '^\!' | awk '{print $2}' | xargs svn rm  > /dev/null 2>&1

svn stat

svn ci -m "Releasing version $VERSION from https://github.com/MichaelArestad/Press-This/tree/master"

svn copy $SVN_URL/$BRANCH $SVN_URL/$VERSION -m "Tagging version $VERSION, from $SVN_URL/$BRANCH."

echo "All done! See $SVN_URL\n"