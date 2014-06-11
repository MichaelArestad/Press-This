#!/bin/bash

# args: pass a dir or defaults to /tmp
CHECKOUT_DIR=${1-'/tmp'}
BRANCH='trunk'

# make sure the dir in which we expect to svn co exists
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

# Change the stable tag ref in the readme.txt to what it will be once pushed to svn
perl -pi -e "s/Stable tag: .*/Stable tag: $VERSION/" $SRC_DIR/readme.txt
git add $SRC_DIR/readme.txt
git commit -m "Changing the stable tag ref in the readme.txt to $VERSION"

# Tag Git release with plugin version
git tag $VERSION -m "Tagging version $VERSION, matched at $SVN_URL/$VERSION"
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

# Make sure to change the stable tag in the readme.txt in svn trunk, to never forget
perl -pi -e "s/Stable tag: .*/Stable tag: $VERSION/" $DEST_DIR/readme.txt

# svn addremove in $ASSETS_DIR
cd $ASSETS_DIR
svn stat | grep '^\?' | awk '{print $2}' | xargs svn add > /dev/null 2>&1
svn stat | grep '^\!' | awk '{print $2}' | xargs svn rm  > /dev/null 2>&1

# commit assets
svn stat
svn ci -m "Releasing version $VERSION from https://github.com/MichaelArestad/Press-This/tree/master"

# svn addremove in #DEST_DIR
cd $DEST_DIR
svn stat | grep '^\?' | awk '{print $2}' | xargs svn add > /dev/null 2>&1
svn stat | grep '^\!' | awk '{print $2}' | xargs svn rm  > /dev/null 2>&1

# commit trunk
svn stat
svn ci -m "Releasing version $VERSION from https://github.com/MichaelArestad/Press-This/tree/master"

# Tag trunk with new version number
svn copy $SVN_URL/$BRANCH $SVN_URL/tags/$VERSION -m "Tagging version $VERSION, from $SVN_URL/$BRANCH."

# Cleanup
rm -rf $SVN_DIR

echo "All done! See $SVN_URL"