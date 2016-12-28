/* pjax2 v0.4 by cooltyn*/
(function($) {
	jQuery.fn.pjax2 = function(options) {
		options = $.extend({
			beforeSend: function() {
			},
			success: function() {       
			},
			error: function() {
			}
		}, options);   
		$.support.pjax = window.history && window.history.pushState && window.history.replaceState;   
		if ($.support.pjax && window.location.hash != '') {
			window.location.replace('/' + window.location.hash.replace('#!', ''));
		}
		else {
			var frame = this;   
			var pathname = (window.location.pathname+window.location.hash).replace('#!', '');
			var prev_page = pathname;
			function change_url(url) {
				if (url != prev_page) {
					if ($.support.pjax) {
						load_content(url);
						history.pushState(url, null, url);
					}
					else {
						window.location.hash = '#!' + url.slice(1);
					}
				}
			}
			function load_content(url) {
				if (url && url != prev_page) {
					var str = /\/([\w-]*)\/?/.exec(url);
					var page = str[str.length - 1];

					console.log('load_content', url, prev_page, page);

					prev_page = url;
					if (page == '') {
						page = 'index';
					}
					if (page == 'catalog') {
						page = 'objects';
					}
					else if (/catalog\/.+/.test(url) || /photo/.test(url) || /build/.test(url)) {
						page = 'objects_item';
					}
					else if (/news\/.+/.test(url)) {
						page = 'news_item';
					}

					$.ajax({
						type: "GET",
						cache: false,
						url: url,
						beforeSend: function(request) {
							options.beforeSend(page);
							request.setRequestHeader('X-PJAX','true');
						},
						success: function(data) {
							options.success(data, page, url);
							window.document.title = /to_title">(.*)<\/div>/.exec(data)[1];
						},
						error: options.error
					});
					
					//temp
					/*
					data = pages_data[page];
					options.beforeSend(page);
					setTimeout(function() {
						options.success(data, page, url);
					}, 1000);
					*/
				}
			}
			if (/escaped_fragment/.test(window.location.search)) {
				load_js($('body').attr('class').replace('_body', ''), null, pathname);
			}
			else {
				frame.load_content = function(url) {
					change_url(url);
				}
				if ($.support.pjax) {
					history.replaceState(pathname, null);
					window.addEventListener('popstate', function(e) {
						load_content(e.state);
					}, false);
					load_js($('body').attr('class').replace('_body', ''), null, pathname);
				}
				else {
					prev_page = null;
					if (pathname != '/') {
						window.location = '/#!' + pathname.slice(1);
					}
					setTimeout(function() {
						$.router(function() {
							load_content('/' + window.location.hash.replace('#!', ''));
						});
					}, 0);
				}
				$(document).on('click', 'a.pjax', function(e) {
					e.preventDefault();
					change_url($(this).attr('href'));
					return false;
				});
				$('form.pjax').submit(function(e) {
					e.preventDefault();
					change_url($(this).attr('action') + '?' + $(this).serialize());
					return false;
				});
			}     
		}
	};
})(jQuery);