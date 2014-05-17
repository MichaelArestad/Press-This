<?php

if ( ! current_user_can( 'edit_posts' ) || ! current_user_can( get_post_type_object( 'post' )->cap->create_posts ) ) {
	wp_die( __( 'Cheatin&#8217; uh?' ) );
}

require_once( ABSPATH . 'wp-admin/admin-header.php' );
?>

<h1>WE DUCK PUNCHED IT</h1>
<img src="https://i.cloudup.com/_abhsAX8qH.png" />

<?php
require_once( ABSPATH . 'wp-admin/admin-footer.php' );
