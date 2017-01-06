var load_js,
	page,
	old_page = '',
	loader,
	load = true,
	pages = [],
	page_speed = 250;
	
	 
var preloader= {
	cSpeed:9,
	cWidth:64,
	cHeight:64,
	cTotalFrames:18,
	cFrameWidth:64,
	cImageSrc:'img/spritesLoader.png',
	
	cImageTimeout:false,
	cIndex:0,
	cXpos:0,
	cPreloaderTimeout:false,
	SECONDS_BETWEEN_FRAMES:0,
	
	startAnimation : function() {
		
		document.getElementById('loaderImage').style.backgroundImage='url('+preloader.cImageSrc+')';
		document.getElementById('loaderImage').style.width=preloader.cWidth+'px';
		document.getElementById('loaderImage').style.height=preloader.cHeight+'px';
		
		//FPS = Math.round(100/(maxSpeed+2-speed));
		FPS = Math.round(100/preloader.cSpeed);
		preloader.SECONDS_BETWEEN_FRAMES = 1 / FPS;
		
		preloader.cPreloaderTimeout=setTimeout('preloader.continueAnimation()', preloader.SECONDS_BETWEEN_FRAMES/1000);
		
	},
	
	continueAnimation : function() {
		
		preloader.cXpos += preloader.cFrameWidth;
		//increase the index so we know which frame of our animation we are currently on
		preloader.cIndex += 1;
		 
		//if our cIndex is higher than our total number of frames, we're at the end and should restart
		if (preloader.cIndex >= preloader.cTotalFrames) {
			preloader.cXpos =0;
			preloader.cIndex=0;
		}
		
		if(document.getElementById('loaderImage'))
			document.getElementById('loaderImage').style.backgroundPosition=(-preloader.cXpos)+'px 0';
		
		preloader.cPreloaderTimeout=setTimeout('preloader.continueAnimation()', preloader.SECONDS_BETWEEN_FRAMES*1000);
	},
	
	stopAnimation : function() {//stops animation
		clearTimeout(preloader.cPreloaderTimeout);
		preloader.cPreloaderTimeout=false;
	},
	
	imageLoader : function(s, fun)//Pre-loads the sprites image
	{
		clearTimeout(preloader.cImageTimeout);
		preloader.cImageTimeout=0;
		genImage = new Image();
		genImage.onload=function (){preloader.cImageTimeout=setTimeout(fun, 0)};
		genImage.onerror=new Function('console.log(\'Could not load the image\')');
		genImage.src=s;
	},
	
	init:function() {
		preloader.imageLoader(preloader.cImageSrc, 'preloader.startAnimation(); preloader.stopAnimation();');
	}
};

$(document).ready(function() {
	// variables
	page = $('body').attr('class');
	loader = $('.ajax-loader');
	//preloader.init();

	// add bg to page 
	$('main').append('<div class="bg_t"></div><div class="bg_b"></div>');

	// resize page
	$('.page_wrap').css({'min-height': $(window).height() - 243 + 'px'});

	// show/hide header
	var header = $('header');
	var scr = $(document).scrollTop();
	header.find('menu').css({'opacity': scr > 0 ? 0 : 1});
	header.find('.fixed_left, .fixed_right').css({'opacity': scr > 0 ? 1 : 0});
	header.find('.fixed_menu').bind('mouseenter', function() {
		show_header();
	});
	//header.bind('mouseleave', function() {
		//hide_header();
	//});
	$(window).scroll(function() {
		toggle_header();
	});
	$(window).trigger('scroll');

	// scroll to top/bottom
	$('a[href=#top]').bind('click', function() {
		$('html, body').animate({scrollTop: $('a[name=top]').offset().top}, 150);
		return false;
	});
	$('a[href=#bottom]').bind('click', function() {
		$('html, body').animate({scrollTop: $('a[name=bottom]').offset().top}, 150);
		return false;
	});

	// init pjax
	$('body').pjax2({
		beforeSend: function(url) {
			console.log('beforeSend', url, page);
			load = false;
			loader.show();
			//preloader.continueAnimation();
			if (page.indexOf(url) == -1 && url.indexOf(page) == -1 || $(document).scrollTop() >= $(window).height()) {
				$('html, body').animate({scrollTop: 0}, 150);
			}
			unload_js(page);
		},
		success: function(data, url, full_url) {
			console.log('success', url, full_url);
			page = url;
			var title = /to_title\">(.*)<\/div>/.exec(data)[1];
			var keywords = /to_keywords\">(.*)<\/div>/.exec(data)[1];
			var description = /to_description\">(.*)<\/div>/.exec(data)[1];
			var content = /to_content\">([\s\S]*)<\/div>\s*$/.exec(data)[1];
			var character = /to_character\">(.*)<\/div>/.exec(data)[1];
			var fixed = /to_fixed\">(.*)<\/div>/.exec(data)[1];
			console.log('success', title, keywords, description);
			window.document.title = title;
			$('meta[name=keywords]').attr('content', keywords);
			$('meta[name=description]').attr('content', description);
			$('.page_wrap').append('<div class="page ' + url + '_page">' + content + '</div>');
			$('.character').removeClass('moved').removeAttr('style').html(character);
			$('.fixed_buttons').html(fixed);
			loader.hide();
			//preloader.stopAnimation()
			load_js(page, old_page, full_url);

			//add_stat(full_url);
		},
		error: function() {
			console.log('error');
			loader.hide();
			//preloader.stopAnimation()
			load = true;
		}
	});
	
	$(document).on('click', '.sendForm', function(e){
		e.preventDefault();
		var form=$(this).closest('form');
		form.find('.err').text('');
		var url = form.attr('action')+'?asc='+$('div.body').attr('rel')+'&'+form.serialize();
		
		//var data= {"result":"error", "fields":{"name":"Введите Ф.И.О."} } 
		
		$.post(url, {}, function(data){
			if (data.result=="ok") {
				form.find('input[type=text], textarea, select').val('').trigger('change');
				form.find('.err').text('');
				if ( form.closest('.popup').length > 0 ) {
					var pop=form.closest('.popup').attr('id');
					popup.p_hide(pop);
				} 
				var success = form.attr('data-success') ? form.attr('data-success') : 'success';
				popup.p_show(success);
				setTimeout(function(){ popup.p_hide(success); }, 5000);
			}
			else {
				for (var key in data.fields) {
					form.find('[name='+key+']').siblings('.err').text(data.fields[key]);
				}
				
				if ( form.closest('.popup').length == 0 ) {
					$('html, body').animate({scrollTop:form.offset().top}, 200);
				}
			}
		}, "json");
		
	});
});

var resize_timer = '';
var window_w = $(window).width();
var window_h = $(window).height();

$(window).resize(function() {
	clearTimeout(resize_timer);
	resize_timer = setTimeout(function() {
		if (window_w != $(window).width() || window_h != $(window).height()) {
			all_resize();
			window_w = $(window).width();
			window_h = $(window).height();
		}
	}, 100);
});

function all_resize() {
	$('.page_wrap').css({'min-height': $(window).height() - 243 + 'px'});
	if ($('.index_page').size() > 0) {
		vitrina.resize();
	}
	if ($('.objects_page').size() > 0 ) {
		objects.resize();
	}
	if ($('.objects_item_page').size() > 0 ) {
		object.resize();
	}
}

function toggle_header() {
	var header = $('header');
	var scr = $(document).scrollTop();
	header.find('menu, .fixed_left, .fixed_right').stop(true, false);
	if (scr > 0) {
		header.find('menu').animate({'opacity': 0, y: -10, duration: 250}, function() {
			header.find('menu').hide();
		});
		header.find('.fixed_left, .fixed_right').show().animate({'opacity': 1, duration: 250});
	}
	else {
		header.find('menu').show().animate({'opacity': 1, y:  0, duration: 250});
		header.find('.fixed_left, .fixed_right').animate({'opacity': 0, duration: 250}, function() {
			header.find('.fixed_left, .fixed_right').hide();
		});
	}
}

function show_header() {
	var header = $('header');
	var scr = $(document).scrollTop();
	if (scr > 0) {
		header.find('menu').stop(true, true).show().css({y: -10}).animate({'opacity': 1, y: 0, duration: 250});
		header.find('.fixed_left, .fixed_right').stop(true, true).animate({'opacity': 0, duration: 250});
	}
}

function hide_header() {
	var header = $('header');
	var scr = $(document).scrollTop();
	if (scr > 0) {
		header.find('menu').stop(true, true).animate({'opacity': 0, y: -10, duration: 250}, function() {
			header.find('menu').css({y: 0}).hide();
		});
		header.find('.fixed_left, .fixed_right').stop(true, true).show().animate({'opacity': 1, duration: 250});
	}
}

unload_js = function(targ) {
	console.log('unload_js', targ);
	// hide objects, stop animation etc.
};

load_js = function(targ, prev, full_url) {
	console.log('load_js', targ, prev, full_url);

	$('body').attr('class', targ + '_body');
	$('header menu a').removeClass('sel').removeClass('pjax-sel').filter('.' + targ + '_lnk').addClass('pjax-sel');
	
	var next_page = $('.page_wrap').find('.' + targ + '_page:last');
	var prev_page = next_page.prevAll();
	if (targ == 'index') {
		$('main > .head, main .bg_t, main .bg_b').stop(true).transition({'opacity': 0}, page_speed, function() {
			$(this).hide();
		});
	}
	else if (prev == 'index') {
		 $('main > .head, main .bg_t, main .bg_b').stop(true).css({'opacity': 0}).show().transition({'opacity': 1}, page_speed);
	}
	prev_page.stop(true).transition({'opacity': 0}, page_speed);
	next_page.css({'opacity': 0, 'position': 'absolute', 'left': 0, 'top': 0, 'z-index': 2}).transition({'opacity': 1}, page_speed, function() {
		next_page.css({'position': 'relative', 'z-index': 1});
		prev_page.remove();
		page_elements.init(!prev);
		load = true;
		if ($('.vitrina').size() == 0) {
			page_elements.show_page_elements();
		}
		else {
			vitrina.show_page_elements();
		}
		$(window).scroll(function() {
			page_elements.show_page_elements();
		});
		all_resize();
	});
	old_page = targ;
	
	$('form input[name=phone]').mask("8 (999)999-99-99",{autoclear: false});
};

var page_elements = {
	init: function(is_first) {
		if ($('.popup').size() > 0) {
			popup.init();
		}
		if ($('.select').size() > 0) {
			$('.select select').each(function() {
				select.init($(this));
			});
		}
		if ($('.slider').size() > 0) {
			$('.slider').each(function() {
				if (!$(this).hasClass('prevent')) slider.init($(this));
			});
		}
		if ($('.switcher').size() > 0) {
			$('.switcher').each(function() {
				switcher.init($(this));
			});
		}
		if ($('.index_page').size() > 0) {
			vitrina.init();
		}
		if ($('.objects_page').size() > 0) {
			filter.init();
			objects.init();
		}
		if ( $('.object-photos').size() > 0 || $('.object_header .flats_filter').size() > 0) {
			object.init();
		}
		if ($('.news_page, .news_item_page').size() > 0) {
			news.init();
		}
		if ($('.mortgage').size() > 0) {
			mortgage.init();
		}
		if ($('.gallery_photos').size() > 0) {
			gallery.init();
		}
		if ($('.resume').size() > 0) {
			resume.init();
		}
		if ($('.gallery_steps').size() > 0) {
			steps.init();
		}
		if ($('.tour_wrap').size() > 0) {
			pano.init();
		}
		if ($('.map').size() > 0) {
			//map.init();
			$('.map').each(function(){
				this.map = jQuery.extend({}, map);
				this.map.div = $(this).children('div');
				this.map.init();
			});
		}
		if ($('.vacancy').size() > 0) {
			vac.init();
		}
		if ($('#flow-player').size() > 0) {
			flow_player.init(is_first);
		}
		$('.head .phone i').unbind('click').bind('click', function() {
			popup.p_show('call');
		});
	},
	show_page_elements: function() {
		var arr = ['img/header_bg.png', 'img/bg_top.png', 'img/bg_top.png'];
		preload_images(arr, function() {
			var scr = $(document).scrollTop();
			var header_vis = scr < $('main .head').outerHeight();
			$('header:not(.moved)').transition({opacity: 1, y: 0, duration: 250}, function() { $('header').addClass('moved'); });
			$('main .head:not(.moved)').transition({opacity: 1, y: 0, duration: 250}, function() { $('main .head').addClass('moved'); });
			$('main .bg_t:not(.moved)').transition({opacity: 1, y: 0, duration: 250}, function() { $('main .bg_t').addClass('moved'); });
			$('main nav:not(.moved)').transition({opacity: 1, y: 0, duration: 250}, function() { $('main nav').addClass('moved'); });
			$('main .move:not(.moved), main .bg_b:not(.moved), footer .content:not(.moved)').each(function() {
				$(this).transition({opacity: 1, y: 0, duration: 250}, function() { $(this).addClass('moved'); });
			});
		});
	}
};

var resume={ 
	init: function(){
		if ($('.phoneField').mask) $('.phoneField').mask("+7 (999)999-99-99",{autoclear: false});
		
		$('select.select2').select2({minimumResultsForSearch: -1});
		
		$('.addFields').click(function(e) {
			e.preventDefault();
			var block = $( $(this).attr('href') ).clone();
			block.removeAttr('id');
			block.find('.select2-container').remove();
			block.find('select').removeClass('select2-offscreen');
			block.find('select, input, textarea').val('');
			$(this).before(block);
			
			block.find('select').select2({minimumResultsForSearch: -1});
		});
	},
};

var vitrina = {
	inited: false,
	height: 0,
	coeff: 1,
	block: '',
	num: 0,
	cur: 1,
	is_anim: false,
	move_speed: 500,
	move_pause: 10000,
	move_timer: '',
	parallax_speed: 3000,
	parallax_dir: 1,
	parallax_offset: 15,
	cursor_pos: 0,
	arr: [],
	init: function() {
		if ($('.vitrina').size() > 0) {
			vitrina.block = $('.vitrina');
			var line = vitrina.block.find('.line');
			var nav = vitrina.block.find('.nav');
			if (typeof(vitrina_data) != 'undefined') {
				for (var j = 1; j <= 3; j ++) {
					line.append('<div class="layer" level="' + j + '"></div>');
					var layer = line.find('.layer[level=' + j + ']');
					var c = 0;
					for (var i in vitrina_data) {
						if (j == 1) {
							var it = '<div class="item" ind="' + c + '"><img src="' + vitrina_data[i].photo + '" class="photo" /></div>';
							if (vitrina_data[i].logo_svg && (!detectIE() || detectIE() >= 9)) {
								nav.append('<span ind="' + c + '"><img src="' + vitrina_data[i].logo_svg + '" /><i></i></span>');
							}
							else if (vitrina_data[i].logo_png) {
								nav.append('<span ind="' + c + '"><img src="' + vitrina_data[i].logo_png + '" /><i></i></span>');
							}
						}
						else if (j == 2) {
							if (vitrina_data[i].logo_svg && (!detectIE() || detectIE() >= 9)) {
								var it = '<div class="item" ind="' + c + '"><span class="info info' + vitrina_data[i].type + '"><img src="img/v_it_bg' + vitrina_data[i].type + '.png" class="bg" /><img src="' + vitrina_data[i].logo_svg + '" class="logo" /><span class="txt"><span class="in">' + vitrina_data[i].txt + '</span></span><img src="img/v_lnk.png" class="lnk scale" /></span></div>';
							}
							else if (vitrina_data[i].logo_png) {
								var it = '<div class="item" ind="' + c + '"><span class="info info' + vitrina_data[i].type + '"><img src="img/v_it_bg' + vitrina_data[i].type + '.png" class="bg" /><img src="' + vitrina_data[i].logo_png + '" class="logo" /><span class="txt"><span class="in">' + vitrina_data[i].txt + '</span></span><img src="img/v_lnk.png" class="lnk" /></span></div>';
							}
						}
						else {
							var it = '<a href="' + vitrina_data[i].url + '" class="item" ind="' + c + '"><img src="' + vitrina_data[i].img + '" class="img" /></a>';
						}
						layer.append(it);
						c ++;
					}
				}
				vitrina.num = vitrina.block.find('.layer:first').find('.item').size();
				if (vitrina.block.find('.item').size() > 1) {
					vitrina.block.find('.nav span').bind('click', function() {
						vitrina.move_to_item(parseInt($(this).attr('ind')));
					});
					vitrina.block.find('.prev').bind('click', function() {
						vitrina.move_to_prev();
					});
					vitrina.block.find('.next').bind('click', function() {
						vitrina.move_to_next();
					});
				}
			}
			vitrina.resize(true);
		}
	},
	show_page_elements: function() {
		vitrina.arr = [];
		vitrina.arr.push(vitrina.block.find('.bg img').attr('src'));
		if (typeof(vitrina_data) != 'undefined') {
			for (var i in vitrina_data) {
				vitrina.arr.push(vitrina_data[i].photo);
				if (vitrina_data[i].logo_svg && (!detectIE() || detectIE() >= 9)) {
					vitrina.arr.push(vitrina_data[i].logo_svg);
				}
				else if (vitrina_data[i].logo_png) {
					vitrina.arr.push(vitrina_data[i].logo_png);
				}
				vitrina.arr.push(vitrina_data[i].img);
			}
		}
		preload_images(vitrina.arr, function() {
			page_elements.show_page_elements();
			vitrina.block.find('.bg, .layer[level=1]').transition({opacity: 1, duration: 250});
			vitrina.block.find('.layer[level=2]').delay(50).transition({opacity: 1, duration: 250});
			vitrina.block.find('.layer[level=3]').delay(100).transition({opacity: 1, duration: 250});
			vitrina.block.find('.button-big').delay(50).transition({opacity: 1, y: 0, duration: 250});
			vitrina.block.find('.nav').delay(100).transition({opacity: 1, y: 0, duration: 250});
			vitrina.block.bind('mousemove', function(e) {
				vitrina.follow_cursor(e);
			}).bind('mouseleave', function() {
				vitrina.stop_parallax_timer();
			});
		});
	},
	resize: function(init) {
		if ($('.vitrina').size() > 0) {
			vitrina.height = Math.min(Math.max($(window).height() - vitrina.block.offset().top - 160, 520), 880);
			vitrina.coeff = vitrina.height / 880;
			vitrina.block.height(vitrina.height);
			vitrina.item_width = Math.round(vitrina.block.attr('ow') * vitrina.coeff);
			vitrina.item_height = Math.round(vitrina.block.attr('oh') * vitrina.coeff);
			vitrina.item_mtop = Math.round(vitrina.block.attr('omt') * vitrina.coeff);
			var bg = vitrina.block.find('.bg');
			var bgi = bg.find('img');
			img_load(bgi.attr('src'), function() {
				if (bgi.width() < bg.width()) {
					bgi.width('110%').height('auto');
				}
				bgi.css({'margin': '0 ' + (bg.width() - bgi.width()) / 2 + 'px'})
			});
			var lw = 0;
			vitrina.block.find('.layer').each(function(i) {
				vitrina.block.find('.item').each(function(i) {
					$(this).css({'width': vitrina.item_width + 'px', 'height': vitrina.item_height + 'px', 'top': vitrina.item_mtop + 'px', 'z-index': vitrina.num - i});
					lw += $(this).outerWidth();
				});
			});

			vitrina.item_width = vitrina.block.find('.item:first').outerWidth();
			vitrina.block.find('.line, .layer').width(lw * 1.5);
			var s = 90 * vitrina.coeff;
			var pm = vitrina.item_width * 0.5;
			var nm = vitrina.item_width * 0.45 - s;
			vitrina.block.find('.prev').css({'width': s  + 'px', 'height': s + 'px', 'margin-right': pm + 'px', 'margin-top': - s / 2 + 'px'});
			vitrina.block.find('.next').css({'width': s  + 'px', 'height': s + 'px', 'margin-left': nm + 'px', 'margin-top': - s / 2 + 'px'});
			vitrina.cursor_pos = $(window).width() * 0.5;
			vitrina.set_to_item(vitrina.cur);
			if (init) {
				vitrina.fit_text_size();
				vitrina.block.find('.info .txt').css({'visibility': 'visible'});
			}
			else {
				vitrina.fit_text_size();
			}
		}
	},
	set_to_item: function(ind) {
		var line = vitrina.block.find('.line');
		var it = vitrina.block.find('.item[ind=' + ind + ']');
		if (vitrina.block.find('.item').index(it) == 0) {
			vitrina.block.find('.item').last().prependTo(line);
		}
		else if (vitrina.block.find('.item').index(it) == vitrina.num - 1) {
			vitrina.block.find('.item').first().appendTo(line);
		}
		vitrina.change_levels();
		line.css({'left': vitrina.get_line_offset(ind) + 'px'});
		vitrina.block.find('.nav span').removeClass('sel').filter('[ind=' + ind + ']').addClass('sel');
	},
	move_to_item: function(ind) {
		if (ind > vitrina.cur) {
			vitrina.move_to_next(ind - vitrina.cur, Math.round(vitrina.move_speed / (ind - vitrina.cur)));
		}
		else if (ind < vitrina.cur) {
			vitrina.move_to_prev(vitrina.cur - ind, Math.round(vitrina.move_speed / (vitrina.cur - ind)));
		}
		vitrina.block.find('.nav span').removeClass('sel').filter('[ind=' + ind + ']').addClass('sel');
	},
	move_to_prev: function(diff, speed) {
		if (!vitrina.is_anim) {
			vitrina.is_anim = true;
			var speed = (typeof(speed) != 'undefined') ? speed : vitrina.move_speed;
			var ind = vitrina.cur > 0 ? vitrina.cur - 1 : vitrina.num - 1;
			var line = vitrina.block.find('.line');
			var layer = vitrina.block.find('.layer');
			layer.each(function() {
				var it = $(this).find('.item[ind=' + ind + ']');
				$(this).find('.item').last().clone().prependTo($(this));
			});
			vitrina.change_levels();
			line.css({'left': vitrina.get_line_offset(vitrina.cur) + 'px'});
			vitrina.block.find('.nav span').removeClass('sel').filter('[ind=' + ind + ']').addClass('sel');
			var lvl3 = vitrina.block.find('.layer[level=3]');
			lvl3.stop().animate({'margin-left': - vitrina.parallax_offset * vitrina.coeff * 2 + 'px'}, vitrina.move_speed * 0.8, 'linear', function() {
				lvl3.animate({'margin-left': 0}, vitrina.move_speed * 0.5);
			});
			line.stop().animate({'left': vitrina.get_line_offset(ind) + 'px'}, speed, 'linear', function() {
				layer.each(function() {
					$(this).find('.item').last().remove();
				});
				vitrina.cur = parseInt(ind);
				vitrina.is_anim = false;
				if (typeof(diff) != 'undefined' && diff > 1) {
					vitrina.move_to_prev(diff - 1);
				}
			});
		}
	},
	move_to_next: function(diff, speed) {
		if (!vitrina.is_anim) {
			vitrina.is_anim = true;
			var speed = (typeof(speed) != 'undefined') ? speed : vitrina.move_speed;
			var ind = vitrina.cur < vitrina.num - 1 ? vitrina.cur * 1 + 1 : 0;
			var line = vitrina.block.find('.line');
			var layer = vitrina.block.find('.layer');
			layer.each(function() {
				var it = $(this).find('.item[ind=' + ind + ']');
				$(this).find('.item').first().clone().appendTo($(this));
			});
			vitrina.change_levels();
			vitrina.block.find('.nav span').removeClass('sel').filter('[ind=' + ind + ']').addClass('sel');
			var lvl3 = vitrina.block.find('.layer[level=3]');
			lvl3.stop().animate({'margin-left': vitrina.parallax_offset * vitrina.coeff * 2 + 'px'}, vitrina.move_speed * 0.8, 'linear', function() {
				lvl3.animate({'margin-left': 0}, vitrina.move_speed * 0.5);
			});
			line.stop().animate({'left': vitrina.get_line_offset(ind) + 'px'}, speed, 'linear', function() {
				layer.each(function() {
					$(this).find('.item').first().remove();
				});
				line.css({'left': vitrina.get_line_offset(ind) + 'px'});
				vitrina.cur = parseInt(ind);
				vitrina.is_anim = false;
				if (typeof(diff) != 'undefined' && diff > 1) {
					vitrina.move_to_next(diff - 1);
				}
			});
		}
	},
	stop_move_timer: function() {
		clearTimeout(vitrina.move_timer);
		vitrina.move_timer = '';
		$('.vitrina').find('.layer, .line').stop();
	},
	start_move_timer: function() {
		vitrina.move_timer = setTimeout(function() {
			vitrina.move_to_next();
		}, vitrina.move_pause);
	},
	change_levels: function() {
		vitrina.block.find('.item').each(function() {
			$(this).css({'z-index': vitrina.num - $(this).attr('ind') + 1});
		});
	},
	get_line_offset: function(ind) {
		var it = vitrina.block.find('.item[ind=' + ind + ']');
		var line_offset = ($(window).width() - vitrina.item_width) * 0.5 - it.position().left;
		return line_offset;
	},
	stop_parallax_timer: function(set_to_def) {
		$('.vitrina').find('.layer').each(function() {
			$(this).stop(true, false);
			if (set_to_def) {
				$(this).css({'left': 0});
			}
		});
	},
	start_parallax_timer: function(dir, speed) {
		dir = typeof(dir) != 'undefined' ? dir : vitrina.parallax_dir;
		speed = typeof(speed) != 'undefined' ? speed : vitrina.parallax_speed;
		vitrina.parallax_dir = dir;
		vitrina.block.find('.layer, .bg').each(function() {
			var layer = $(this);
			var level = parseInt(layer.attr('level'));
			var pos = layer.position().left;
			if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {
				layer.stop(true, false).animate({x: dir * vitrina.parallax_offset * (level + 1) + 'px'}, pos == 0 ? speed * 0.5 : speed, 'linear');
			}
			else {
				layer.stop(true, false).animate({'margin-left': dir * vitrina.parallax_offset * (level + 1) + 'px'}, pos == 0 ? speed * 0.5 : speed, 'linear');
			}
		});
	},
	follow_cursor: function(e) {
		var pos = mousePageXY(e).x;
		var diff = vitrina.cursor_pos - pos;
		var dir = diff > 0 ? 1 : -1;
		if (Math.abs(diff) > 50) {
			vitrina.cursor_pos = pos;
			if (dir != vitrina.parallax_dir) {
				vitrina.stop_parallax_timer();
				vitrina.start_parallax_timer(dir, vitrina.parallax_speed * 0.5);
			}
		}
	},
	fit_text_size: function() {
		vitrina.block.find('.info .txt').each(function() {
			$(this).css('font-size', ($(this).closest('.info').hasClass('info2') ? 38 : 24) + 'px');
			while($(this).find('.in').height() > $(this).height() * 0.8) {
				$(this).css('font-size', (parseInt($(this).css('font-size')) - 1) + 'px');
			}
		});
	}
};

var popup = {
	init: function() {
		$('.popup:not(.inited)').each(function() {
			$(this).find('.close, .bg').bind('click', function() {
				popup.p_hide($(this).closest('.popup').attr('id'));
			});
			$(this).appendTo($('.body')).addClass('inited');
		});
	},
	p_hide: function(id) {
		var p = (typeof(id) == 'string') ? $('#' + id) : $('.popup');
		p.animate({'opacity': 0}, 500, function() {
			p.css({'opacity': 1}).addClass('hidden');
		});
	},
	p_show: function(id) {
		var p = $('#' + id).first();
		p.css({'opacity': 0}).removeClass('hidden');
		popup.p_pos(id);
		p.animate({'opacity': 1}, 500);
	}, 
	p_pos: function(id) {
		var p = $('#' + id);
		p.css({'top': $('.page_wrap').offset().top + 'px'});
		var t = Math.max(($(window).height() - p.find('.win').outerHeight()) / 2 - p.offset().top + $(document).scrollTop(), 40);
		var l = ($(window).width() - p.find('.win').outerWidth()) / 2;
		p.find('.win').css({'top': t + 'px', 'left': l + 'px'});
	}
};

var select = {
	init: function(sel) {
		if (!sel.hasClass('inited')) {
			var id = sel.attr('id');
			sel.selectmenu({
				position: {my: "left+15 top"},
				open: function(event, ui) {
					var menu = sel.selectmenu('menuWidget');
					var block = sel.closest('.select');
					menu.outerWidth(block.width() - 30);
					if (!block.hasClass('inited')) {
						menu.find('li#' + menu.attr('aria-activedescendant')).attr('active', 1);
						block.addClass('inited');
					}
				},
				change: function(event, ui) {
					var menu = sel.selectmenu('menuWidget');
					menu.find('li').removeAttr('active').filter('[id=' + menu.attr('aria-activedescendant') + ']').attr('active', 1);
					sel.change();
				}
			});
			sel.closest('.select').find('.ui-icon').addClass('scale');
			sel.addClass('inited');
		}
	}
};

var slider = {
	init: function(sl) {
		if (!sl.hasClass('inited')) {
			var name = sl.attr('name');
			var step = parseFloat(sl.attr('step'));
			var min = parseInt(sl.attr('min'));
			var max = parseInt(sl.attr('max'));
			var from = (sl.attr('from') && sl.attr('from') != '') ? parseInt(sl.attr('from')) : min;
			var to = (sl.attr('to') && sl.attr('to') != '') ? parseInt(sl.attr('to')) : max;
			var inp_from = $('input[name=' + name + '_from]');
			var inp_to = $('input[name=' + name + '_to]');
			sl.slider({
				range: true,
				min: min,
				max: max,
				step: step,
				values: [from, to],
				create:function(){
					$('input[name=' + name + '_from], input[name=' + name + '_to]').keypress(function(e){
						if ( e.which < 48 || e.which > 57 ) return false;
					});
				},
				slide: function(event, ui) {
					inp_from.val(number_format(ui.values[0], 1));
					inp_to.val(number_format(ui.values[1], 1));
					var hl = sl.find('.ui-slider-handle-left span').html(number_format(ui.values[0], 1));
					var hr = sl.find('.ui-slider-handle-right span').html(number_format(ui.values[1], 1));
				},
				change: function(event, ui) {
					inp_from.val(number_format(ui.values[0], 1));
					inp_to.val(number_format(ui.values[1], 1));
					var hl = sl.find('.ui-slider-handle-left span').html(number_format(ui.values[0], 1));
					var hr = sl.find('.ui-slider-handle-right span').html(number_format(ui.values[1], 1));
				}
			});
			sl.find('.ui-slider-handle:first').addClass('ui-slider-handle-left').append('<span></span><i class="scale"></i>');
			sl.find('.ui-slider-handle:last').addClass('ui-slider-handle-right').append('<span></span><i class="scale"></i>');
			sl.find('.ui-slider-handle-left span').html(number_format(sl.slider('values', 0), 1));
			sl.find('.ui-slider-handle-right span').html(number_format(sl.slider('values', 1), 1));
			inp_from
				.val(number_format(sl.slider('values', 0), 1))
				.bind('change', function() {
					var val = $(this).val();
					var re = /[0-9\u0020]/;
					if (re.test(val)) {
						val = val.replace(/\u0020/g, '');
						if (val >= min && val <= sl.slider('values', 1)) {
							sl.slider('values', 0, val);
						}
						else {
							sl.slider('values', 0, min);
						}
					}
					else {
						sl.slider('values', 0, min);
					}
				});
			inp_to
				.val(number_format(sl.slider('values', 1), 1))
				.bind('change', function() {
					var val = $(this).val();
					var re = /[0-9\u0020]/;
					if (re.test(val)) {
						val = val.replace(/\u0020/g, '');
						if (val >= sl.slider('values', 0) && val <= max) {
							sl.slider('values', 1, val);
						}
						else {
							sl.slider('values', 1, max);
						}
					}
					else {
						sl.slider('values', 1, max);
					}
				});
			sl.addClass('inited');
		}
	}
};

var switcher = {
	init: function(sw) {
		sw.find('input').each(function() {
			if (sw.find('a[value=' + $(this).val() + ']').size() == 1) {
				switcher.change_value(sw.attr('name'), $(this).val());
			}
		});
		sw.find('a').each(function() {
			if ($(this).hasClass('on')) {
				switcher.change_value(sw.attr('name'), $(this).attr('value'), true);
			}
		});
		sw.find('a').bind('click', function() {
			switcher.change_value(sw.attr('name'), $(this).attr('value'), !$(this).hasClass('on'));
		});
	},
	change_value: function(name, val, on) {
		var sw = $('.switcher[name=' + name + ']');
		var a = sw.find('a[value=' + val + ']');
		a.toggleClass('on', on);
		if (on) {
			if (sw.find('input[value=' + val + ']').size() == 0) {
				sw.append('<input type="hidden" name="' + name + '[]" value="' + val + '" />');
			}
		}
		else {
			sw.find('input[value=' + val + ']').remove();
		}
	}
};

var map_cluster = {
	cluster_init: function (m) {
		if (m.clusterer) {
			m.clusterer.clearMarkers();
		}
		m.clusterer = new MarkerClusterer(m.map, m.markers, {
			maxZoom: 14,
			averageCenter: true,
			ignoreHidden: true,
			styles: [{
				url: 'img/obj_marker_c.png',
				width: 74,
				height: 82,
				anchor: [7, 20],
				fontFamily: 'pf_dindisplay_promedium',
				fontWeight: 'normal',
				textColor: '#231f20',
				textSize: 36
			}]
		});
	}
};

var filter = {
	block: '',
	markers: [],
	init: function() {
		if ($('.filter').size() > 0) {
			filter.block = $('.filter');
			filter.block.find('.toggle_lnk').bind('click', filter.toggle_filter);
			filter.block.find('.button-reset').bind('click', filter.reset_filter);
			filter.init_metro();
			filter.init_gmap();
			$('.popup_map').find('.bg, .close').bind('click', filter.hide_info);
			filter.inited = true;
		}
	},
	init_metro: function() {
		var m = $('.metro_map');
		for (var i in objects_data) {
			if (data_metro[objects_data[i].metro]) {
				var it = data_metro[objects_data[i].metro];
				m.append('<span class="map_item" style="left:' + it.i_pos[0] + 'px; top:' + it.i_pos[1] + 'px;"><img src="img/map_metro/i' + it.rel + '.gif" id="m_i' + i + '" /><i oid="' + i + '"></i></span>');
			}
		}
		m.append('<div class="infoBox"></div>');
		m.find('.map_item i').bind('mouseover', function() {
			filter.show_info('metro', $(this).attr('oid'));
		}).bind('click', function() {
			var is_sel = $(this).hasClass('sel');
			$(this).toggleClass('sel');
			filter.toggle_map_value($(this).attr('oid'), !is_sel);
		});
	},
	init_gmap: function() {
		google.maps.event.addDomListener(window, 'load', function() {
			var mapOptions = {
				zoom: 10,
				disableDefaultUI: true,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			filter.map = new google.maps.Map(document.getElementById('objects_gmap'), mapOptions);
			var infoOptions = {
				alignTop: true,
				infoBoxClearance: new google.maps.Size(10,10),
				pixelOffset: new google.maps.Size(55,-160),
				closeBoxURL: ''
			};
			filter.infobox = new InfoBox(infoOptions);
			var latlngbounds = new google.maps.LatLngBounds();
			var count = 0;
			for (var i in objects_data) {
				var title = $('<div />').html(objects_data[i].title).text();
				var point = new google.maps.LatLng(objects_data[i].coord[0], objects_data[i].coord[1]);
				latlngbounds.extend(point);
				var marker = new google.maps.Marker({
					position: point,
					map: filter.map,
					icon: {
						url: 'img/obj_marker.png',
						size: new google.maps.Size(74,82),
						anchor: new google.maps.Point(30,82)
					},
					id: i,
					title: title
				});
				filter.markers.push(marker);
				google.maps.event.addListener(marker, 'mouseover', function() {
					filter.show_info('gmap', this);
				});
				google.maps.event.addListener(marker, 'click', function() {
					var is_sel = this.icon.url == 'img/obj_marker_s.png';
					var img = {
						url: 'img/obj_marker' + (!is_sel ? '_s' : '') + '.png',
						size: new google.maps.Size(74,82),
						anchor: new google.maps.Point(30,82)
					};
					this.setIcon(img);
					filter.toggle_map_value(this.id, !is_sel);
				});
				count ++;
			}
			if (count > 1) {
				filter.map.fitBounds(latlngbounds);
			}
			else {
				filter.map.setCenter(latlngbounds.getCenter());
			}
			map_cluster.cluster_init(filter);
		});
	},
	build_info: function (item) {
		var html = '';
		var title = item.title;
		var re = /\«.*?\»|\".*?\"/ig;
		html += '<div class="info_title">' + title.replace(re, '<a href="' + item.url + '">' + title.match(re)[0] + '</a>') + '</div>';
		html += '<div class="info_content">';
		html += '<table cellpadding="0" cellspacing="0"><tr>';
		if (item.photo && item.photo != '') {
			html += '<td><div class="img"><div class="in"><img src="' + item.photo + '" /></div></div></td>';
		}
		html += '<td>';
		if (item.addr && item.addr != '') {
			html += '<div class="b20">' + item.addr + '</div>';
		}
		if (item.desc && item.desc != '') {
			html += '<div class="b20">' + item.desc + '</div>';
		}
		if (item.square && item.square != '') {
			html += '<div><strong>????:</strong> ' + item.square + '</div>';
		}
		html += '</td>';
		html += '</tr></table>';
		html += '</div>';
		return html;
	},
	show_info: function(type, param) {
		if (type == 'gmap') {
			if (!filter.infobox.getVisible() || filter.infobox.getPosition() != param.getPosition()) {
				filter.infobox.setContent('<div class="close" onclick="filter.hide_info();"><i class="rotate"></i></div><div class="info">' + filter.build_info(objects_data[param.id]) + '</div>');
				filter.infobox.open(filter.map, param);
			}
		}
		else if (type == 'metro') {
			var m = $('.metro_map .map_item i[oid=' + param + ']').closest('.map_item');
			var l = Math.max(Math.min(m.position().left - 40, 295), 0);
			var t = m.position().top + 40;
			if (t > 545) {
				t = t - 470;
			}
			$('.metro_map .infoBox').html('<div class="close" onclick="filter.hide_info();"><i class="rotate"></i></div><div class="info">' + filter.build_info(objects_data[param]) + '</div>').css({'left': l + 'px', 'top': t + 'px'}).show();
		}
	},
	hide_info: function(type) {
		filter.infobox.close();
		$('.metro_map .infoBox').html('').hide();
	},
	toggle_map_value: function(id, tgl) {
		var form = filter.block.find('form');
		if (tgl && form.find('input[name="object[]"][value="' + id +'"]').size() == 0) {
			form.append('<input type="hidden" name="object[]" value="' + id +'" />');
		}
		else if (!tgl) {
			form.find('input[name="object[]"][value="' + id +'"]').remove();
		}
	},
	toggle_filter: function() {
		filter.block.toggleClass('opened');
		var is_open = filter.block.hasClass('opened');
		filter.block.find('.toggle_lnk').html(filter.block.hasClass('opened') ? 'Свернуть фильтр' : 'Расширенный фильтр');
		if (is_open) {
			filter.block.find('.for-full').hide().removeClass('hidden').slideDown(500);
		}
		else {
			filter.block.find('.for-full').slideUp(500, function() {
				filter.block.find('.for-full').addClass('hidden').show();
			});
		}
	},
	reset_filter: function() {
		var form = filter.block.find('form');
		form.find('input[type=text]').each(function() {
			$(this).val('').change();
		});
		form.find('select').each(function() {
			$(this).val($(this).find('option:first').attr('value')).change().selectmenu('refresh');
		});
	}
};

var objects = {
	block: '',
	init: function() {
		if ($('.objects_list').size() > 0) {
			objects.block = $('.objects_list');
			//objects.init_gmap();
			objects.fill_list();
			$('body').bind('click', objects.hide_info);
			$('.object .photo, .object .title, .object .info').bind('click', function(e) {
				e.stopPropagation();
			});
			objects.resize();
		}
	},
	resize: function() {
		if ($('.objects_list').size() > 0) {
			$('.object .info').hide();
			objects.block.css({'margin-left': 0, 'margin-right': 0});
			var m = Math.floor((objects.block.width() - $('.object:first').width() * 3) / 4);
			$('.object').css({'margin-left': m + 'px', 'margin-right': m + 'px'});
			objects.block.css({'margin-left': - m + 'px', 'margin-right': - m + 'px'});
		}
	},
	fill_list: function() {
		objects.block.html('');
		if (typeof(objects_data) != 'undefined') {
			var c = 1;
			var html = '';
			html += "<div class='container' style='margin-left: 0;'>"
			for (var i in objects_data) {
				console.log(objects_data[i]);
				html += '<div class="col-md-4 col-sm-6 col-xs-12"><div class="object object' + c + ' move" oid="' + i + '" onmouseleave="objects.hide_info(); " >';
				html += '<a href="' + objects_data[i].url + '" class="pjax"><div class="photo" onmouseenter="objects.show_info(\'' + i + '\');">';
				html += '<span class="img"><img src="' + objects_data[i].photo + '" /></span>';
				if (objects_data[i].logo_svg && (!detectIE() || detectIE() >= 9)) {
					html += '<span class="logo"><img src="' + objects_data[i].logo_svg + '" /></span>';
				}
				else if (objects_data[i].logo_png) {
					html += '<span class="logo"><img src="' + objects_data[i].logo_png + '" /></span>';
				}
				else if (objects_data[i].logo_txt) {
					html += '<span class="logo_txt"><span>' + objects_data[i].logo_txt + '</span></span>';
				}
				if (objects_data[i].offer && objects_data[i].offer != '') {
					html += '<div class="offer" style=\"width: 100px; height: 100px; border-radius: 50px;\"><span>' + objects_data[i].offer + '</span></div>';
				}
				html += '</div> </a>';
				
				html += '<h3><a style="color: #f36b22; text-decoration: underline;" href="' + objects_data[i].url + '" class="title pjax"  >' + objects_data[i].title + '</a></h3>';
				html += '<div class="b20">' + objects_data[i].addr + ' </div>';
				if (objects_data[i].site && objects_data[i].site != '') {
					html += '<div class="b10"></div>';
				}
				else {
					html += '<div class="b10">&nbsp;</div>';
				}
				html += '<a href="javascript:void(0)" class="button" onclick="objects.show_request(\'' + i + '\');"><span>????? ???</span></a>';
				html += '<div class="info">';
				html += '<div class="title"><span>' + objects_data[i].title + '</span></div>';
				html += '<div class="content">';
				if (objects_data[i].square) {
					html += '<div class="b5"> ' + objects_data[i].square + '</div>';
				}
				if (objects_data[i].rooms) {
					html += '<div class="b5"><strong>??????:</strong> ' + objects_data[i].rooms + '</div>';
				}
				if (objects_data[i].builds) {
					html += '<div class="b5"><strong>????</strong> ' + objects_data[i].builds + '</div>';
				}
				if (objects_data[i].state) {
					html += '<div class="b5"><strong>Стадия строительства:</strong> ' + objects_data[i].state + '</div>';
				}
				/*
				if (objects_data[i].price) {
					html += '<div class="b5"><strong>Стоимость:</strong> ' + objects_data[i].price + '</div>';
				}
				if (objects_data[i].price_m) {
					html += '<div class="b5"><strong>Стоимость за м2:</strong> ' + objects_data[i].price_m + '</div>';
				}
				*/
				html += '<div class="b30"></div>';
				html += '<div align="center"><a href="' + objects_data[i].url + '" class="button pjax"><span>?????/span></a></div>';
				html += '</div>';
				html += '</div>';
				html += '</div></div>';
				c = c < 3 ? c + 1 : 1;
			}
			html += "</div>"
			html += '<br clear="all" />';
			objects.block.html(html);
			$(window).trigger('scroll');
		}
	},
	show_request: function(oid) {
		var val = oid.split('obj')[1];
		$('#request select[name=object]').val(val).change().selectmenu('refresh');
		popup.p_show('request');
	},
	show_info: function(oid) {
		objects.hide_info(oid);
		var obj = $('.object[oid=' + oid + ']');
		var info = obj.find('.info');
		var l = obj.offset().left + info.width() + 230 <= $(window).width() ? 230 : -320;
		obj.css({'z-index': 2});
		info.css({'left': l + 'px'}).show();//.stop().animate({'opacity': 1}, 250);
	},
	hide_info: function(oid) {
		var info = $('.object .info:visible');
		//info.animate({'opacity': 0}, 250, function() {
			info.hide().css({'opacity': 1}).closest('.object').css({'z-index': 1});
		//});
	},
	init_gmap: function() {
		//google.maps.event.addDomListener(window, 'load', function() {
			var mapOptions = {
				center: new google.maps.LatLng(43.4203085,39.9608601),
				zoom: 12,
				disableDefaultUI: true,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			objects.map = new google.maps.Map(document.getElementById('object_gmap'), mapOptions);
		//});
	},
	show_gmap: function(id) {
		popup.p_show('object_map');
		if (!objects.map) objects.init_gmap();
		if (objects.marker) {
			objects.marker.setMap(null);
		}
		var point = new google.maps.LatLng(objects_data[id].coord[0], objects_data[id].coord[1]);
		objects.marker = new google.maps.Marker({
			position: point,
			map: objects.map,
			icon: {
				url: 'img/obj_marker.png',
				size: new google.maps.Size(74,82),
				anchor: new google.maps.Point(30,82)
			}
		});
		objects.map.setCenter(point);
		
	}
};

var object = {
	init: function() {
		if ($('.object_header').size() > 0) {
			//object.init_gmap();
			object.header_is_anim = false;
			object.items = $('.object_header .photos .item');
			object.items_num = object.items.size();
			if (object.items_num > 0) {
				if (object.items_num > 1) {
					$('.object_header').append('<div class="points"></div>');
					object.points = $('.object_header .points');
					object.items.each(function() {
						object.points.append('<span></span>');
					});
					object.points = object.points.find('span');
					object.points.bind('click', function() {
						object.header_set_item(object.points.index($(this)), true);
					});
				}
				object.header_set_item(0, false);
			}
		}
		if ($('.object_options').size() > 0) {
			object.options_is_anim = false;
			$('.object_options .prev').bind('click', function() {
				var ind = $('.object_options .item').index($('.object_options .item.sel'));
				if (ind > 0 && !$(this).hasClass('disabled')) {
					object.options_set_item(ind - 1, true);
				}
			});
			$('.object_options .next').bind('click', function() {
				var ind = $('.object_options .item').index($('.object_options .item.sel'));
				if (ind < $('.object_options .item').size() - 1 && !$(this).hasClass('disabled')) {
					object.options_set_item(ind + 1, true);
				}
			});
			object.options_set_item(0, false);
		}
		if ($('.offers').size() > 0) {
			object.offers_is_anim = false;
			var w = $('.offers .item').eq(0).outerWidth() * $('.offers .item').length + 20;
			$('.offers').css('max-width', w+'px');
			$('.offers .prev').bind('click', function() {
				var ind = $('.offers .item').index($('.offers .item.sel'));
				if (ind > 0 && !$(this).hasClass('disabled')) {
					object.offers_set_item(ind - 1, true);
				}
			});
			$('.offers .next').bind('click', function() {
				var ind = $('.offers .item').index($('.offers .item.sel'));
				if (ind < $('.offers .item').size() - 1 && !$(this).hasClass('disabled')) {
					object.offers_set_item(ind + 1, true);
				}
			});
			object.offers_set_item(0, false);
		}
		if (typeof(builds) != 'undefined' && typeof(flats) != 'undefined' && typeof(flats_chess) != 'undefined') {
			if ($('.flats_plan').size() > 0 && $('.flats_filter').size() > 0) {
				$('.flats_filter .toggler a').bind('click', function() {
					if (!$(this).hasClass('disabled')) {
						$(this).closest('.toggler').toggleClass('toggled', $(this).closest('.toggler').find('a').index($(this)) > 0);
						object.toggle_plan_type($(this).attr('value'));
					}
				});
				$('.flats_plan .toggle_lnk').bind('click', function() {
					object.toggle_plan_height();
				});
				if (typeof(plan_3d) != 'undefined' && plan_3d != '') {
					object.build_plan_3d();
				}
				else {
					$('.flats_filter .toggler a[value=3d]').addClass('disabled');
					$('.flats_filter .toggler a[value=2d]').click();
				}
				object.build_plan_2d();
				object.flats_filter_init();
			}
			if ($('.flats_list').size() > 0) {
				object.fill_flats_list();
			}
			if (typeof(show_flat) != 'undefined') {
				setTimeout(function() {
					object.show_flat_info(show_flat.flat);
				}, 2000);
			}
		}
		if (typeof(parking_data) != 'undefined') {
			if ($('.parking_plan').size() > 0) {
				$('.parking_toggler a').bind('click', function() {
					if (!$(this).hasClass('disabled')) {
						$(this).closest('.toggler').toggleClass('toggled', $(this).closest('.toggler').find('a').index($(this)) > 0);
						object.build_parking_section($(this).attr('value'));
						object.toggle_parking_section($(this).attr('value'));
						object.fill_parking_list();
					}
				});
				object.build_parking_section($('.parking_toggler a:first').attr('value'));
				object.toggle_parking_section($('.parking_toggler a:first').attr('value'));
			}
			if ($('.parking_list').size() > 0) {
				object.fill_parking_list();
			}
		}
		object.resize();
	},
	resize: function() {
		if ($('.object_options').size() > 0) {
			object.options_width = -20;
			$('.object_options .item').each(function() {
				object.options_width += $(this).outerWidth();
			});
			$('.object_options').toggleClass('sliding', object.options_width > $('.object_options').width());
		}
		if ($('.wide_block .menu').size() > 0) {
			var pos = $('.wide_block .menu').offset().top;
			var i = 0, first = [];
			$('.wide_block .menu a').removeClass('first').each(function(ind) {
				if ($(this).offset().top - 5 == pos + 35 * i) {
					first.push(ind);
					i ++;
				}
			});
			for (var j = 0; j < first.length; j ++) {
				$('.wide_block .menu a').eq(first[j]).addClass('first');
			}
		}
		if ($('.offers').size() > 0) {
			object.offers_width = -20;
			$('.offers .item').each(function() {
				object.offers_width += $(this).outerWidth(true);
			});
			$('.offers').toggleClass('sliding', object.offers_width > $('.offers').width());
		}
	},
	header_set_item: function(ind, anim) {
		if (anim) {
			if (!object.header_is_anim) {
				object.header_is_anim = true;
				if (object.items_num > 1) {
					object.stop_header_item_auto();
					object.points.removeClass('sel').eq(ind).addClass('sel');
				}
				var prev = object.items.filter('.sel');
				var next = object.items.eq(ind);
				img_load(next.find('img').attr('data-original'), function() {
					next.find('img').attr('src', next.find('img').attr('data-original'));
					next.css({'z-index': 10}).animate({'opacity': 1, duration: 1000, easing: 'linear'}, function() {
						prev.css({'opacity': 0, 'z-index': 1}).removeClass('sel');
						next.addClass('sel').css({'z-index': 5});
						object.header_is_anim = false;
						if (object.items_num > 1) {
							object.start_header_item_auto(ind < object.items_num - 1 ? ind + 1 : 0);
						}
					}).find('img').css({'scale': 1.1}).animate({'scale': 1, duration: 1000, easing: 'linear'});
				});
			}
		}
		else {
			if (object.items_num > 1) {
				object.points.removeClass('sel').eq(ind).addClass('sel');
			}
			img_load(object.items.eq(ind).find('img').attr('data-original'), function() {
				object.items.css({'opacity': 0, 'z-index': 1}).removeClass('sel').eq(ind).css({'opacity': 1, 'z-index': 5}).addClass('sel').find('img').attr('src', object.items.eq(ind).find('img').attr('data-original'));
				if (object.items_num > 1) {
					object.start_header_item_auto(ind < object.items_num - 1 ? ind + 1 : 0);
				}
			});
		}
	},
	stop_header_item_auto: function() {
		clearTimeout(object.timer_item);
	},
	start_header_item_auto: function(ind) {
		object.timer_item = setTimeout(function() {
			object.header_set_item(ind, true);
		}, 4000);
	},
	options_set_item: function(ind, anim) {
		var pos = - $('.object_options .item').eq(ind).position().left;
		//console.log(ind, pos);
		if (anim) {
			if (!object.options_is_anim) {
				object.options_is_anim = true;
				$('.object_options .items').animate({'x': pos + 'px', duration: 500, easing: 'linear'}, function() {
					$('.object_options .item').removeClass('sel').eq(ind).addClass('sel');
					object.options_is_anim = false;
				});
			}
			$('.object_options .prev').toggleClass('disabled', pos >= 0);
			$('.object_options .next').toggleClass('disabled', object.options_width + pos <= $('.object_options').width());
		}
		else {
			$('.object_options .item').removeClass('sel').eq(ind).addClass('sel');
			$('.object_options .items').css({'x': pos + 'px'});
			$('.object_options .prev').toggleClass('disabled', pos >= 0);
			$('.object_options .next').toggleClass('disabled', object.options_width + pos <= $('.object_options').width());
		}
	},
	offers_set_item: function(ind, anim) {
		var pos = - $('.offers .item').eq(ind).position().left;
		if (anim) {
			if (!object.offers_is_anim) {
				object.offers_is_anim = true;
				$('.offers .items').animate({'x': pos + 'px', duration: 500, easing: 'linear'}, function() {
					$('.offers .item').removeClass('sel').eq(ind).addClass('sel');
					object.offers_is_anim = false;
				});
			}
			$('.offers .prev').toggleClass('disabled', pos >= 0);
			$('.offers .next').toggleClass('disabled', object.offers_width + pos <= $('.offers').width());
		}
		else {
			$('.offers .item').removeClass('sel').eq(ind).addClass('sel');
			$('.offers .items').css({'x': pos + 'px'});
			$('.offers .prev').toggleClass('disabled', pos >= 0);
			$('.offers .next').toggleClass('disabled', object.offers_width + pos <= $('.offers').width());
		}
	},
	init_gmap: function() {
		//google.maps.event.addDomListener(window, 'load', function() {
			var mapOptions = {
				zoom: 12,
				disableDefaultUI: true,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			object.map = new google.maps.Map(document.getElementById('object_gmap'), mapOptions);
		//});
	},
	show_gmap: function(lat, lng) {
		popup.p_show('object_map');
		if (!object.map) object.init_gmap();
		if (object.marker) {
			object.marker.setMap(null);
		}
		var point = new google.maps.LatLng(lat, lng);
		objects.marker = new google.maps.Marker({
			position: point,
			map: object.map,
			icon: {
				url: 'img/obj_marker.png',
				size: new google.maps.Size(74,82),
				anchor: new google.maps.Point(30,82)
			}
		});
		object.map.setCenter(point);
		
	},
	toggle_plan_type: function(type) {
		var plan =  $('.flats_plan');
		var is_collapsed = plan.hasClass('collapsed');
		plan.find('.plan').addClass('hidden').filter('.plan_' + type).removeClass('hidden');
		plan.height(is_collapsed ? 322 : plan.find('.plan:not(.hidden)').attr('data-height'));
	},
	toggle_plan_height: function() {
		var plan =  $('.flats_plan');
		var side = $('.sidebar');
		var lnk = plan.find('.toggle_lnk');
		var is_collapsed = plan.hasClass('collapsed');
		if (is_collapsed) {
			side.animate({'height': '674px'}, 500, function() {
				side.removeClass('collapsed');
			});
			plan.animate({'height': plan.find('.plan:not(.hidden)').attr('data-height') + 'px'}, 500, function() {
				plan.removeClass('collapsed');
				lnk.text(lnk.attr('text-hide'));
			});
			setTimeout(function() {
				plan.find('.markers, .prev, .next').animate({'opacity': 1}, 150);
			}, 350);
		}
		else {
			plan.find('.markers, .prev, .next').animate({'opacity': 0}, 150);
			side.animate({'height': '322px'}, 500, function() {
				side.addClass('collapsed');
			});
			plan.animate({'height': '322px'}, 500, function() {
				plan.addClass('collapsed');
				lnk.text(lnk.attr('text-show'));
			});
		}
	},
	build_plan_3d: function() {
		var plan = $('.flats_plan .plan_3d');
		plan.append('<div class="plan_in"><div class="markers"></div></div>').attr('data-height', 674);
		var html = '';
		for (var b in builds) {
			if (builds[b].left && builds[b].top) {
				html += '<a href="javascript:void(0)" data-build="' + b + '" class="marker" style="left: ' + builds[b].left + '%; top: ' + builds[b].top + '%;">' + builds[b].name + '</a>';
			}
		}
		if (sections)
			for (var s in sections) {
				if (sections[s].left && sections[s].top) {
					html += '<a href="javascript:void(0)" data-section="' + s + '" class="marker" style="left: ' + sections[s].left + '%; top: ' + sections[s].top + '%;">' + sections[s].name + '</a>';
				}
			}
		html += '<div class="tooltip"></div>';
		img_load(plan_3d, function(iw, ih) {
			plan.css({'background-image': 'url(' + plan_3d + ')'});
			plan.find('.markers').width(iw * 674 / ih).html(html);
			plan.find('.marker').bind('mouseover', function() {
				if (!$('.flats_plan').hasClass('collapsed')) {
					object.show_plan_3d_info($(this).attr('data-build'), $(this).attr('data-section'));
				}
			}).bind('mouseleave', function() {
				if (!$('.flats_plan').hasClass('collapsed')) {
					object.hide_plan_3d_info();
				}
			}).bind('click', function(e) {
				e.preventDefault();
				if (!$('.flats_plan').hasClass('collapsed')) {
					object.toggle_plan_height();
					if ( $(this).attr('data-build') ) {
						$('#build').val( $(this).attr('data-build') );
					}
					if ( $(this).attr('data-section') ) {
						$('#build').val( $(this).attr('data-section').split('_')[0] );
						$('#section').val( $(this).attr('data-section').split('_')[1] );
					}
					$('select#section').trigger('change').selectmenu('refresh');
					$('select#build').trigger('change').selectmenu('refresh');
					object.fill_flats_list()
					setTimeout( function() {$('html, body').animate({scrollTop: $('.flats_list').offset().top }, 300) }, 500);
				}
			});
		});
	},
	hide_plan_3d_info: function() {
		var tip = $('.flats_plan .plan_3d .tooltip');
		tip.stop().animate({'opacity': 0}, 150, function() {
			tip.html('').css({'margin-left': '40px', 'margin-top': '-40px'});
		});
	},
	show_plan_3d_info: function(build, section) {
		var plan = $('.flats_plan .plan_3d');
		var data = build ? builds[build] : sections[section];
		var tip = plan.find('.tooltip');
		var html = '';
		var head = build ? 'корпус ' + data.name : ' секция ' + data.name;
		html += '<div class="title"><table cellpadding="0" cellspacing="0" width="100%"><tr><td class="name"> ' + head + '</td><td class="status">' + data.status + '</td></tr></table></div>';
		html += '<div class="info"><table cellpadding="0" cellspacing="0" width="100%">';
		html += '<tr><td><b>Этажность</b></td><td align="right">' + data.max_floors + '</td></tr>';
		html += '<tr><td colspan="2"><hr /></td></tr>';
		for (var i in data.prices_from) {
			html += '<tr><td><b>' + i + '-комнатные кв.</b></td><td align="right">от ' + number_format(data.prices_from[i]) + ' руб.</td></tr>';
		}
		html += '<tr><td colspan="2"><hr /></td></tr>';
		html += '<tr><td><b>Срок сдачи</b></td><td align="right">' + data.gk_date + '</td></tr>';
		html += '</table></div>';
		tip.html(html).css({'left': data.left + '%', 'top': data.top + '%', 'margin-left': '40px', 'margin-top': '-40px'});
		tip.css({
			'margin-left': tip.offset().left - plan.offset().left + 300 > plan.width() ? '-340px' : '40px',
			'margin-top': tip.offset().top - plan.offset().top + 300 < plan.height() ? '-40px' : '-200px'
		});
		tip.stop().animate({'opacity': 1}, 150);
	},
	build_plan_2d: function(build, section) {
		build = build || $('.flats_filter #build').val();
		var plan = $('.flats_plan .plan_2d');
		var height = Math.max(builds[build].max_floors * 24 + 206, 674);
		plan.html('').height(height).attr('data-height', height);
		if (flats_chess[build]) {
			var data = flats_chess[build];
			var min_section = 99999;
			var cur_section = 0;
			var max_section = 0;
			var max_flats = 0;
			for (var s in data) {
				min_section = Math.min(min_section, s);
				max_section = Math.max(max_section, s);
			}
			section = section || min_section;
			plan.append('<div class="house_title">Корпус ' + builds[build].name + ' <span class="orange">Секция ' + section + '</span></div>');
			plan.append('<div class="house" data-build="' + build + '" data-section="' + section + '"></div>');
			plan.append('<div class="tooltip"></div>');
			if (section > min_section) {
				plan.append('<a href="javascript:void(0)" onclick="object.build_plan_2d(' + build + ', ' + object.get_prev_section(build, section) + ');" class="prev">Секция<span>' + object.get_prev_section(build, section) + '</span></div>');
			}
			if (section < max_section) {
				plan.append('<a href="javascript:void(0)" onclick="object.build_plan_2d(' + build + ', ' + object.get_next_section(build, section) + ');" class="next">Секция<span>' + object.get_next_section(build, section) + '</span></div>');
			}
			for (var f in data[section]) {
				var html = '';
				html += '<div class="floor" data-floor="' + f + '">';
				html += '<div class="lbl"><span class="l">' + f + '</span><span class="r">' + f + '</span></div>';
				for (var n in data[section][f]) {
					var a = data[section][f][n];
					html += a > 1 ? '<a href="javascript:void(0)" class="flat" data-flat="' + a + '" onclick="object.show_flat_info(' + a + ');">' + flats[a].rooms + '</a>' : '<div class="flat"></div>';
				}
				max_flats = n;
				html += '</div>';
				plan.find('.house').prepend(html);
			}
			if (max_flats > 0) {
				html = '<div class="door" style="left: ' + ((Math.ceil(max_flats / 2) - 1) * 23) + 'px;"></div>';
				if (max_flats > 3) {
					html += '<div class="door" style="left: ' + (Math.ceil(max_flats / 2) * 23) + 'px;"></div>';
				}
			}
			plan.find('.house').append(html);
			plan.find('.house a.flat').bind('mouseover', function() {
				if (!$('.flats_plan').hasClass('collapsed')) {
					object.show_plan_2d_info($(this).attr('data-flat'));
				}
			}).bind('mouseleave', function() {
				if (!$('.flats_plan').hasClass('collapsed')) {
					object.hide_plan_2d_info();
				}
			});
			object.get_flats_from_cookie();
		}
	},
	get_prev_section: function(build, section) {
		var s = section - 1;
		if (typeof(flats_chess[build][s]) != 'undefined') {
			return s;
		}
		else {
			return object.get_prev_section(build, s);
		}
	},
	get_next_section: function(build, section) {
		var s = section * 1 + 1;
		if (typeof(flats_chess[build][s]) != 'undefined') {
			return s;
		}
		else {
			return object.get_next_section(build, s);
		}
	},
	hide_plan_2d_info: function() {
		var tip = $('.flats_plan .plan_2d .tooltip');
		tip.stop().animate({'opacity': 0}, 150, function() {
			tip.html('');
		});
	},
	show_plan_2d_info: function(flat) {
		var plan = $('.flats_plan .plan_2d');
		var data = flats[flat];
		var tip = plan.find('.tooltip');
		var lnk = plan.find('.house .floor[data-floor=' + data.floor + '] .flat[data-flat=' + flat + ']');
		var html = '';
		html += '<div class="title"><table cellpadding="0" cellspacing="0" width="100%"><tr><td class="name">корпус ' +  builds[data.build_id].name + '</td><td class="status">секция ' + data.section + '</td></tr></table></div>';
		html += '<div class="info"><table cellpadding="0" cellspacing="0" width="100%">';
		html += '<tr><td><b>Этаж</b></td><td align="right">' + data.floor + '</td></tr>';
		html += '<tr><td><b>№ на площадке</b></td><td align="right">' + data.number + '</td></tr>';
		html += '<tr><td><b>Комнат</b></td><td align="right">' + data.rooms + '</td></tr>';
		html += '<tr><td><b>Площадь</b></td><td align="right">' + data.square + ' м<sup>2</sup></td></tr>';
		//html += '<tr><td><b>Стоимость</b></td><td align="right">' + number_format(data.price) + ' руб.</td></tr>';
		html += '</table></div>';
		tip.html(html).css({
			'left': lnk.offset().left - plan.offset().left + 340 < plan.width() ? lnk.offset().left - plan.offset().left : lnk.offset().left - plan.offset().left - 340 + 'px',
			'top': lnk.offset().top - plan.offset().top + 300 < plan.height() ? lnk.offset().top - plan.offset().top + 80 : lnk.offset().top - plan.offset().top - 200 + 'px'
		});
		tip.stop().animate({'opacity': 1}, 150);
	},
	flats_filter_init: function() {
		$('.flats_filter [name=build]').bind('change', function() {
			object.build_plan_2d($(this).val());
		});
		if ($('.flats_list').size() > 0) {
			$('.flats_filter form').bind('submit', function(e) {
				e.preventDefault();
				object.fill_flats_list();
				$('html, body').animate({scrollTop: $('.flats_list').offset().top}, 150);
			});
			$('.flats_filter .button-reset').bind('click', function() {
				var form = $('.flats_filter form');
				form.find('select').each(function() {
					var def = $(this).find('option[data-role=default]') || $(this).find('option:first');
					$(this).val(def.attr('value')).change().selectmenu('refresh');
				});
				form.find('.slider').each(function() {
					$(this).slider('values', [$(this).attr('min'), $(this).attr('max')]);
				});
				form.find('.switcher').each(function() {
					var sw = $(this);
					sw.find('input').each(function() {
						switcher.change_value(sw.attr('name'), $(this).attr('value'), false);
					});
				});
				object.fill_flats_list();
				$('html, body').animate({scrollTop: $('.flats_list').offset().top}, 150);
			});
		}
	},
	fill_flats_list: function() {
		var table = $('.flats_list .data_table');
		var thead = table.find('thead');
		var tbody = table.find('tbody');
		tbody.html('');
		var html = '';
		var form = $('.flats_filter form');
		for (var a in flats) {
			var is_rooms = false;
			form.find('input[name^=rooms]').each(function() {
				if (flats[a].rooms == $(this).val() || $(this).val() == 4 && flats[a].rooms > 4) {
					is_rooms = true;
				}
			});
			is_rooms = is_rooms || form.find('input[name^=rooms]').size() == 0;
			var is_filter = flats[a].build_id == form.find('[name=build]').val() &&
							( form.find('[name=section]').val() ? flats[a].section == form.find('[name=section]').val() : true ) &&
							flats[a].floor >= form.find('select[name=floor_from]').val() &&
							flats[a].floor <= form.find('select[name=floor_to]').val() &&
							flats[a].square >= number_unformat(form.find('input[name=square_from]').val()) &&
							flats[a].square <= number_unformat(form.find('input[name=square_to]').val()) &&
							//flats[a].price >= number_unformat(form.find('input[name=price_from]').val()) * 1000000 &&
							//flats[a].price <= number_unformat(form.find('input[name=price_to]').val()) * 1000000 &&
							flats[a].status == 'в продаже' &&
							is_rooms;
			if (is_filter) {
				html += '<tr data-flat="' + a + '"' + (flats[a].plan ? ' class="highlite"' : '') + '>';
				html += '<td align="center">' + builds[flats[a].build_id].name + '</td>';
				html += '<td align="center">' + flats[a].section + '</td>';
				html += '<td align="center">' + flats[a].floor + '</td>';
				html += '<td align="center">' + flats[a].rooms + '</td>';
				html += '<td align="center">' + flats[a].number + '</td>';
				html += '<td align="center">' + flats[a].square + '</td>';
				//html += '<td align="center">' + number_format(flats[a].price) + '</td>';
				//html += '<td align="center">' + number_format(flats[a].price_m) + '</td>';
				html += '<td align="center">'+ (flats[a].plan ? '<a href="javascript:void(0)" class="ico ico_plan scale"></a>' : '') + '</td>';
				html += '<td align="center"><a href="javascript:void(0)" class="ico ico_request scale"></a></td>';
				html += '<td align="center">'+ (flats[a].plan ? '<a href="javascript:void(0)" class="ico ico_print scale"></a>' : '') + '</td>';
				//html += '<td align="center"><a href="javascript:void(0)" class="ico ico_send scale"></a></td>';
				html += '</tr>';
			}
		}
		tbody.html(html);
		var is_plans = tbody.find('tr.highlite').size() > 0;
		thead.find('tr').each(function() {
			$(this).find('th').eq(8).toggle(is_plans);
			$(this).find('th').eq(10).toggle(is_plans);
		});
		tbody.find('tr').each(function() {
			$(this).find('td').eq(8).toggle(is_plans);
			$(this).find('td').eq(10).toggle(is_plans);
		});
		tbody.find('tr.highlite').bind('click', function() {
			object.show_flat_info($(this).attr('data-flat'));
		});
		tbody.find('.ico_plan').bind('click', function(e) {
			e.stopPropagation();
			object.show_flat_info($(this).closest('tr').attr('data-flat'));
		});
		tbody.find('.ico_request').bind('click', function(e) {
			e.stopPropagation();
			$('#flatId').val($(this).closest('tr').attr('data-flat'));
			popup.p_show('flat_request');
		});
		tbody.find('.ico_print').bind('click', function(e) {
			e.stopPropagation();
			object.print_flat($(this).closest('tr').attr('data-flat'));
		});
		tbody.find('.ico_send').bind('click', function(e) {
			e.stopPropagation();
			object.show_flat_link($(this).closest('tr').attr('data-flat'));
		});
		object.get_flats_from_cookie();
		if (table.hasClass('tablesorter')) {
			table.trigger('update');
			table.trigger('pageSet', 1);
		}
		else {
			var pagerOptions = {
				container: $('.flats_list .pager'),
				cssNext: '.next',
				cssPrev: '.prev',
				cssPageDisplay: '.pagedisplay',
				cssPageSize: '.pagesize',
				cssDisabled: 'disabled',
				page: 0,
				size: $('.flats_list .pager .pagesize').val(),
				pageReset: 0,
				fixedHeight: false
			};
			table
				.tablesorter({widgets: ['zebra']})
				.bind('pagerBeforeInitialized pagerChange pagerComplete pagerInitialized pageMoved', function(e, c) {
					var pages = $('.flats_list .pager .pages');
					pages.html('');
					var min = Math.max(c.page + 1 > c.totalPages - 4 ? c.totalPages - 4 : Math.max(c.page - 1, 1), 1);
					var max = Math.min(min + 4, c.totalPages);
					for (var i = min; i <= max; i ++) {
						pages.append('<a href="javascript:void(0)"' + (i == (c.page + 1) ? ' class="sel"' : '') + '>' + i + '</a>')
					}
					pages.find('a').bind('click', function() {
						if (!$(this).hasClass('sel')) {
							$('.flats_list .data_table').trigger('pageSet', parseInt($(this).text()));
						}
					});
				})
				.tablesorterPager(pagerOptions);
		}
	},
	show_flat_info: function(flat) {
		var p = $('#object_flat');
		var data = flats[flat];
		if (!data) return;
		p.find('.title span').html('Корпус ' + builds[data.build_id].name + ' Секция ' + data.section + '<br />Этаж ' + data.floor + ' Квартира ' + data.number);
		p.find('.flat_info').html('');
		popup.p_show('object_flat');
		if (data.plan) {
			p.find('.flat_info').append('<div class="img"></div>');
			popup.p_pos('object_flat');
			img_load(data.plan, function() {
				p.find('.flat_info .img').html('<img src="' + data.plan + '">');
				popup.p_pos('object_flat');
			});
		}
		if (!$('.flats_plan .plan_2d .house .flat[data-flat=' + flat + ']').hasClass('visited')) {
			object.set_flat_to_cookie(flat);
		}
	},
	show_flat_link: function(flat) {
		var p = $('#flat_link');
		p.find('input[name=flat_link]').val(document.location.href + '&flat=' + flat);
		popup.p_show('flat_link');
	},
	print_flat: function(flat) {
		var head = '';
		head += '<link href="/css/all.css?v=3" rel="stylesheet" type="text/css" media="all" />';
		head += '<link href="/css/print.css" rel="stylesheet" type="text/css" media="print" />';
		var content = '<html><head>' + head + '</head><body class="printable">';
		content += '<div class="body">';
		content += '<div class="head">';
		content += '<table cellpadding="0" cellspacing="0" width="100%"><tr>';
		content += '<td width="50%"><span class="logo"><img src="img/logo.png" /></span></td>';
		content += '<td width="50%" align="right"><div class="phone"><small>+7 495</small> 966 88 88<i></i></div></td>';
		content += '</tr></table>';
		content += '</div>';
		content += '<div class="flat_info b20">';
		content += '<h2 class="small black" align="center">Корпус ' + builds[flats[flat].build_id].name + ' Секция ' + flats[flat].section + ' Этаж ' + flats[flat].floor + ' Квартира ' + flats[flat].number + '</h2>';
		content += '<div class="img"><img src="' + flats[flat].plan + '"></div>';
		content += '</div>';
		content += '<table cellpadding="0" cellspacing="0" width="100%" class="footer"><tr>';
		content += '<td width="60%">';
		content += '&copy; 2015 АН “RЯDОМ”. Полный спект услуг на рынке недвижимости.';
		content += '<br />Россия, г. Москва, Москва, Ленинский проспект, 20А, +7 495 9668888';
		content += '</td>';
		content += '<td width="40%" align="right">';
		content += 'Дизайн и разработка <a href="http://www.multiline.ru" target="_blank" title="Multiline">Multiline</a>';
		content += '</td>';
		content += '</tr></table>';
		content += '</div>';
		content += '</body></html>';
		var prwin = window.open('', 'printWin', 'width=740,height=640,toolbar=no,Scrollbars=1');
		if (typeof prwin == 'object') {
			prwin.window.focus();
			prwin.document.open();
			prwin.document.write(content);
			prwin.document.close();
			setTimeout(function() { prwin.window.print(); }, 500);
		}
	},
	get_flats_from_cookie: function() {
		var cookie = getCookie('ryadom_flat');
		var flat_cookie = cookie ? cookie.split('|') : null;
		if (flat_cookie && flat_cookie.length > 0) {
			for (var i = 0; i < flat_cookie.length; i ++) {
				$('.flats_plan .plan_2d .house .flat[data-flat=' + flat_cookie[i] + ']').addClass('visited');
				$('.flats_list .data_table tr[data-flat=' + flat_cookie[i] + ']').addClass('visited');
			}
		}
	},
	set_flat_to_cookie: function(flat) {
		var nextyear = new Date();
		nextyear.setFullYear(nextyear.getFullYear() + 1);
		setCookie('ryadom_flat', flat, nextyear.toGMTString());
		$('.flats_plan .plan_2d .house .flat[data-flat=' + flat + ']').addClass('visited');
		$('.flats_list .data_table tr[data-flat=' + flat + ']').addClass('visited');
	},
	toggle_parking_section: function(floor) {
		$('.parking_plan .floor').addClass('hidden').filter('.floor' + floor).removeClass('hidden');
	},
	build_parking_section: function(floor) {
		var plan = $('.parking_plan .floor' + floor);

		if (!plan.hasClass('inited')) {
			plan.append('<div class="places"></div>');
			var html = '';
			/*for (var p in parking_data.floors[floor].places) {
				if (parking_data.floors[floor].places[p].coords) {
					var c = parking_data.floors[floor].places[p].coords;
					html += '<a href="javascript:void(0)" data-floor="' + floor + '" data-place="' + p + '" class="place" style="left: ' + c[0] + '%; top: ' + c[1] + '%; width: ' + c[2] + '%; height: ' + c[3] + '%;"></a>';
				}
			}
			html += '<div class="tooltip"></div>'; */
			html += '<a href="javascript:void(0)" onclick="object.show_parking_section_big(' + floor + ');" class="zoom scale"></a>';

			img_load(parking_data.sections[floor].plan_s, function(iw, ih) {
				plan.append('<img src="' + parking_data.sections[floor].plan_s + '" class="img" />');
				plan.find('.places').html(html);
				/*plan.find('.place').bind('mouseover', function() {
					object.show_parking_info($(this).attr('data-floor'), $(this).attr('data-place'));
				}).bind('mouseleave', function() {
					object.hide_parking_info();
				});*/
				plan.addClass('inited');
			});
		}
	},
	fill_parking_list: function() {
		var table = $('.parking_list .data_table');
		var tbody = table.find('tbody');
		tbody.html('');
		var html = '';
		var s = $('.parking_toggler').hasClass('toggled') ? $('.parking_toggler a:last').attr('value') : $('.parking_toggler a:first').attr('value');
		//for(var s in parking_data.sections) {
			for (var f in parking_data.sections[s].floors) {
				for (var p in parking_data.sections[s].floors[f].places) {
					var place = parking_data.sections[s].floors[f].places[p];
					if (place.status == 'в продаже') {
						html += '<tr data-floor="' + f + '" data-place="' + p + '">';
						html += '<td align="center">' + f + '</td>';
						html += '<td align="center">' + s + '</td>';
						html += '<td align="center">' + place.number + '</td>';
						html += '<td align="center" data-text="' + place.price + '">' + object.format_num(place.price) + '</td>';
						html += '</tr>';
					}
				}
			}
		//}
		tbody.html(html);
		var pagerOptions = {
			container: $('.parking_list .pager'),
			cssNext: '.next',
			cssPrev: '.prev',
			cssPageDisplay: '.pagedisplay',
			cssPageSize: '.pagesize',
			cssDisabled: 'disabled',
			page: 0,
			size: $('.parking_list .pager .pagesize').val(),
			pageReset: 0,
			fixedHeight: false
			// remove rows from the table to speed up the sort of large tables.
			// setting this to false, only hides the non-visible rows;
			// needed if you plan to add/remove rows with the pager enabled.
			//removeRows: true
		};
		table
			.tablesorter({widgets: ['zebra']})
			.bind('pagerBeforeInitialized pagerChange pagerComplete pagerInitialized pageMoved', function(e, c) {
				var pages = $('.parking_list .pager .pages');
				pages.html('');
				var min = Math.max(c.page + 1 > c.totalPages - 4 ? c.totalPages - 4 : Math.max(c.page - 1, 1), 1);
				var max = Math.min(min + 4, c.totalPages);
				for (var i = min; i <= max; i ++) {
					pages.append('<a href="javascript:void(0)"' + (i == (c.page + 1) ? ' class="sel"' : '') + '>' + i + '</a>')
				}
				pages.find('a').bind('click', function() {
					if (!$(this).hasClass('sel')) {
						$('.parking_list .data_table').trigger('pageSet', parseInt($(this).text()));
					}
				});
			})
			.tablesorterPager(pagerOptions);
	},
	hide_parking_info: function(is_big) {
		var tip = is_big ? $('#parking_floor_big .floor_big .tooltip') : $('.parking_plan .floor .tooltip');
		tip.stop().animate({'opacity': 0}, 150, function() {
			tip.html('').css({'margin-left': '40px', 'margin-top': '-40px'});
		});
	},
	show_parking_info: function(floor, place, is_big) {
		var plan = is_big ? $('#parking_floor_big .floor_big') : $('.parking_plan .floor' + floor);
		var data = parking_data.floors[floor].places[place];
		var tip = plan.find('.tooltip');
		var html = '';
		html += '<div class="title">' + (data.number ? 'Машиноместо № ' + data.number : data.name) + '</div>';
		html += '<div class="info">';
		if (data.level && data.level != '') {
			html += '<div class="b10">Уровень: <strong>' + data.level + '</strong></div>';
		}
		if (data.price && data.price != '') {
			html += '<div class="b10">Цена: <strong>' + data.price + ' руб.</strong></div>';
		}
		if (data.square && data.square != '') {
			html += '<div class="b10">Площадь: <strong>' + data.square + ' м<sup>2</sup></strong></div>';
		}
		html += '</div>';
		tip.html(html).css({'left': data.coords[0] + '%', 'top': data.coords[1] + '%', 'margin-left': '40px', 'margin-top': '-40px'});
		tip.css({
			'margin-left': tip.offset().left - plan.offset().left + 300 > plan.width() ? '-340px' : '40px',
			'margin-top': tip.offset().top - plan.offset().top + 300 < plan.height() ? '-40px' : '-160px'
		});
		tip.stop().animate({'opacity': 1}, 150);
	},
	show_parking_section_big: function(floor) {
		var pop = $('#parking_floor_big');
		popup.p_show('parking_floor_big');
		var plan = pop.find('.floor_big');
		plan.html('<div class="places"></div>');
		/*var html = '';
		for (var p in parking_data.floors[floor].places) {
			if (parking_data.floors[floor].places[p].coords) {
				var c = parking_data.floors[floor].places[p].coords;
				html += '<a href="javascript:void(0)" data-floor="' + floor + '" data-place="' + p + '" class="place" style="left: ' + c[0] + '%; top: ' + c[1] + '%; width: ' + c[2] + '%; height: ' + c[3] + '%;"></a>';
			}
		}
		html += '<div class="tooltip"></div>';*/
		img_load(parking_data.sections[floor].plan_b, function(iw, ih) {
			plan.append('<img style="max-width: 100%;" src="' + parking_data.sections[floor].plan_b + '" class="img" />');
			//plan.find('.places').html(html);
			popup.p_pos('parking_floor_big');
			/*plan.find('.place').bind('mouseover', function() {
				object.show_parking_info($(this).attr('data-floor'), $(this).attr('data-place'), true);
			}).bind('mouseleave', function() {
				object.hide_parking_info(true);
			});*/
		});
	},
	format_num: function(num) {
		var num_new = '';
		var num_str = num.toString();
		if (num > 0) {
			if (num_str.length > 3) {
				var c = 0;
				for (var i=num_str.length - 1; i>=0; i--) {
					c++;
					num_new = num_str.charAt(i) + num_new;
					if (c == 3) {
						num_new = ' ' + num_new;
						c = 0;
					}
				}
			}
			else {
				num_new = num_str;
			}
		}
		else {
			num_new = num_str;
		}
		num_new = num_new.replace('.', ',');
		return num_new;
	}
};

var news = {
	block: '',
	init: function() {
		news.block = $('.news_list');
		news.fill_list();
	},
	fill_list: function() {
		news.block.html('');
		if (typeof(news_data) != 'undefined') {
			var c = 1;
			var html = '';
			for (var i in news_data) {
				html += '<div class="news news' + c + ' move" nid="' + i + '">';
				html += '<table cellpadding="0" cellspacing="0" width="100%"><tr valign="top">';
				html += '<td width="215">';
				html += '<a href="' + news_data[i].url + '" class="photo pjax">';
				var ph = news_data[i].photo ? news_data[i].photo : 'img/news_stub.png';
				html += '<span class="img"><img src="' + ph + '" /></span>';
				html += '</a>';
				html += '</td>';
				html += '<td width="35"></td>';
				html += '<td>';
				html += '<div class="b20"><span class="date">' + news_data[i].date + '</span></div>';
				html += '<h2 class="small"><a href="' + news_data[i].url + '" class="title pjax">' + news_data[i].title + '</a></h2>';
				html += '<div class="txt b20">' + news_data[i].text + '</div>';
				html += '<a href="' + news_data[i].url + '" class="button pjax"><span>подробнее</span></a>';
				html += '</td>';
				html += '</tr></table>';
				html += '</div>';
				c = c < 3 ? c + 1 : 1;
			}
			news.block.html(html);
			$(window).trigger('scroll');
		}
	}
};

var map = {
	map: '',
	mc: [],
	markers: [],
	div : '',
	init: function() {
		var self = this;
		//self.div = $('.map').children('div');
		var id = self.div.attr('id');
		var s = self.div.attr('styles');
		var ui = self.div.attr('show-ui');
		var mapOptions = {
			zoom: 10,
			disableDefaultUI: true,
			panControl: ui == 1 ? true : false,
			zoomControl: ui == 1 ? true : false,
			scrollwheel: false,
			panControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.LEFT_CENTER
			},
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.LEFT_CENTER
			},
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			styles: 
				s == 'yellow' ? [{"featureType":"all","elementType":"all","stylers":[{"hue":"#ffbb00"}]},{"featureType":"all","elementType":"geometry.fill","stylers":[{"hue":"#ffbb00"}]},{"featureType":"all","elementType":"labels.text.fill","stylers":[{"hue":"#ffbb00"}]}] : 
				s == 'grey' ? [{'featureType':'administrative','elementType':'all','stylers':[{'visibility':'on'},{'saturation':-100},{'lightness':20}]},{'featureType':'road','elementType':'all','stylers':[{'visibility':'on'},{'saturation':-100},{'lightness':40}]},{'featureType':'water','elementType':'all','stylers':[{'visibility':'on'},{'saturation':-10},{'lightness':30}]},{'featureType':'landscape.man_made','elementType':'all','stylers':[{'visibility':'simplified'},{'saturation':-60},{'lightness':10}]},{'featureType':'landscape.natural','elementType':'all','stylers':[{'visibility':'simplified'},{'saturation':-60},{'lightness':60}]},{'featureType':'poi','elementType':'all','stylers':[{'visibility':'off'},{'saturation':-100},{'lightness':60}]},{'featureType':'transit','elementType':'all','stylers':[{'visibility':'off'},{'saturation':-100},{'lightness':60}]}] : ''
		};
		self.map = new google.maps.Map(document.getElementById(id), mapOptions);
		self.markers = [];
		if (self.div.attr('zoom')) {
			var z = parseInt(self.div.attr('zoom'));
			self.map.setZoom(z);
		}
		if (self.div.attr('ccoords')) {
			var cc = self.div.attr('ccoords').split(',');
			cc[0] = parseFloat(cc[0]);
			cc[1] = parseFloat(cc[1]);
			self.map.setCenter(new google.maps.LatLng(cc[0], cc[1]));
		}
		if (self.div.attr('mcoords')) {
			var mc = self.div.attr('mcoords').split(',');
			self.mc = [parseFloat(mc[0]), parseFloat(mc[1])];
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(self.mc[0],self.mc[1]),
				map: self.map,
				icon: {
					url: 'img/marker.png',
					size: new google.maps.Size(50,68),
					anchor: new google.maps.Point(25,68)
				},
				logo: self.div.attr('logo') || ''
			});
			self.markers.push(marker);
		}
		if (self.div.attr('logo')) {
			map_cluster.cluster_init(self);
			self.clusterer.setMinimumClusterSize(0);
			self.clusterer.setMaxZoom(null);
			self.clusterer.setGridSize(0);
			self.clusterer.setZoomOnClick(false);
			self.clusterer.setStyles([{
				url: 'img/obj_marker_l.png',
				width: 128,
				height: 145,
				anchorIcon: [145, 54]
			}]);
			self.clusterer.setCalculator(function(marker, index) {
				return {text: '<img src="' + marker[0].logo +  '" class="logo">', index: index}
			});
		}
		if (self.div.attr('data')) {
			var d = eval(self.div.attr('data'));
			if (typeof(d) != 'undefined') {
				if (typeof(d[0]) != 'undefined') {
					self.mc = [d[0].coords[0], d[0].coords[1]];
				}
				var infoOptions = {
					alignTop: true,
					infoBoxClearance: new google.maps.Size(10,10),
					pixelOffset: new google.maps.Size(55,-160),
					closeBoxURL: ''
				};
				self.infobox = new InfoBox(infoOptions);
				var latlngbounds = new google.maps.LatLngBounds();
				for (var i in d) {
					var point = new google.maps.LatLng(d[i].coords[0], d[i].coords[1]);
					latlngbounds.extend(point);
					var marker = new google.maps.Marker({
						position: point,
						map: self.map,
						icon: {
							url: 'img/obj_marker.png',
							size: new google.maps.Size(74,82),
							anchor: new google.maps.Point(35,82)
						},
						type: d[i].type,
						name: d[i].name,
						addr: d[i].addr,
						dist: d[i].dist,
						logo: d[i].logo
					});
					self.markers.push(marker);
				}
				/*if (self.markers.length > 1) {
					self.map.fitBounds(latlngbounds);
				}
				else {
					self.map.setCenter(latlngbounds.getCenter());
				}*/
				self.map.setCenter( self.markers[0].getPosition() );
				self.map.setZoom(16);
				var styles = [
					{
						url: 'img/obj_marker_l.png',
						width: 128,
						height: 145,
						anchorIcon: [145, 54]
					},
					{
						url: 'img/obj_marker.png',
						width: 74,
						height: 82,
						anchorIcon: [82, 30],
						fontFamily: 'pf_dindisplay_promedium',
						fontWeight: 'normal',
						textColor: '#231f20',
						textSize: 20
					}
				];
				map_cluster.cluster_init(self);
				self.clusterer.setMinimumClusterSize(0);
				self.clusterer.setMaxZoom(null);
				self.clusterer.setGridSize(40);
				self.clusterer.setZoomOnClick(false);
				self.clusterer.setStyles(styles);
				self.clusterer.setCalculator(function(markers) {
					for (var i in markers) {
						var src = markers[i].type > 0 ? '' : markers[i].logo;
						var index = markers[i].type > 0 ? 2 : 1;
						var type = markers[i].type;
						var cls = type > 0 ? 'logo logo_s logo_s' + type : 'logo';
						var text = markers.length == 1 ? (type > 0 ? '<span class="' + cls + '"></span>' : '<img src="' + src +  '" class="' + cls + '">') : '<span class="num">' + markers.length + '</span>';
					}
					return {text: text, index: index};
				});
				google.maps.event.addListener(self.clusterer, 'click', function(c) {
					if (c.getMarkers().length == 1) {
						self.show_info(c.getMarkers()[0]);
					}
				});
				google.maps.event.addListener(self.map, 'click', function() {
					self.infobox.close();
				});
				google.maps.event.addListener(self.clusterer, 'clusteringend', function () {
					setTimeout(function() {
						$('.cluster').each(function() {
							$(this).toggleClass('cluster_infra', $(this).find('.logo_s, .num').size() > 0);
						});
					}, 1);
				});
			}
		}
		if (self.div.attr('filter')) {
			var f = $('.' + self.div.attr('filter'));
			if (f.size() == 1) {
				f.find('.type').bind('click', function() {
					$(this).toggleClass('on');
					self.toggle_markers($(this).attr('type'), $(this).hasClass('on'));
					f.find('#selectAll').prop('checked', f.find('.type').size() == f.find('.type.on').size());
				});
				f.find('#selectAll').bind('change', function() {
					self.toggle_markers(0, $(this).prop('checked'));
					f.find('.type').toggleClass('on', $(this).prop('checked'));
				});
			}
		}
	},
	print_map: function() {
		var self = this;
		var c = '&center=' + self.mc[0] + ',' + self.mc[1];
		var z = '&zoom=' + self.map.getZoom();
		var m = '&markers=icon:http%3A%2F%2Fryadom-msk.ru%2Fimg%2Fmarker.png%7C' + self.mc[0] + ',' + self.mc[1];
		var url = 'http://maps.googleapis.com/maps/api/staticmap?size=640x400' + c + m + z + '&sensor=true';
		var head = '';
		head += '<link href="/css/all.css" rel="stylesheet" type="text/css" media="all" />';
		head += '<link href="/css/print.css" rel="stylesheet" type="text/css" media="print" />';
		var content = '<html><head>' + head + '</head><body class="printable">';
		content += '<div class="body">';
		content += '<div class="head">';
		content += '<table cellpadding="0" cellspacing="0" width="100%"><tr>';
		content += '<td width="50%"><span class="logo"><img src="img/logo.png" /></span></td>';
		content += '<td width="50%" align="right"><div class="phone"><small>+7 495</small> 966 88 88<i></i></div></td>';
		content += '</tr></table>';
		content += '</div>';
		content += '<div align="center" class="b10"><img src="' + url + '" /></div>';
		content += '<div align="right" class="b30"><span class="button button-print" onclick="window.print();"><span>распечатать</span></span></div>';
		content += '<table cellpadding="0" cellspacing="0" width="100%" class="footer"><tr>';
		content += '<td width="60%">';
		content += '&copy; 2015 АН “RЯDОМ”. Полный спект услуг на рынке недвижимости.';
		content += '<br />Россия, г. Москва, Москва, Ленинский проспект, 20А, +7 495 9668888';
		content += '</td>';
		content += '<td width="40%" align="right">';
		content += 'Дизайн и разработка <a href="http://www.multiline.ru" target="_blank" title="Multiline">Multiline</a>';
		content += '</td>';
		content += '</tr></table>';
		content += '</div>';
		content += '</body></html>';
		var prwin = window.open('', 'printWin', 'width=700,height=640,toolbar=no,Scrollbars=1');
		if (typeof prwin == 'object') {
			prwin.window.focus();
			prwin.document.open();
			prwin.document.write(content);
			prwin.document.close();
		}
	},
	toggle_markers: function(type, show) {
		var self = this;
		self.infobox.close();
		for (var i = 0; i < self.markers.length; i ++) {
			if ( ( self.markers[i].type == type || type === 0) && self.markers[i].type ) {
				self.markers[i].setVisible(show);
			}
		}
		self.clusterer.repaint();
	},
	show_info: function(m) {
		var self = this;
		if (!self.infobox.getVisible() || self.infobox.getPosition() != m.getPosition()) {
			var html = '';
			html += '<div class="close" onclick="self.infobox.close();"><i class="rotate"></i></div><div class="info">';
			html += '<div class="info_title">' + m.name + '</div>';
			html += '<div class="info_content">';
			if (m.dist && m.dist != '') {
				html += '<div>Удаленность: <strong>' + m.dist + '</strong></div>';
			}
			if (m.addr && m.addr != '') {
				html += '<div style="margin-top:20px;">Адрес:<br /><strong>' + m.addr + '</strong></div>';
			}
			html += '</div>';
			html += '</div>';
			self.infobox.setContent(html);
			self.infobox.open(self.map, m);
		}
	}
};

var mortgage = {
	nowTouch:null,
	init:function() {
		$(".slider").slider({
			range: true,
			create: function( event, ui ) {
				var step=parseFloat($(this).attr('data-step'));
				var min=parseFloat($(this).attr('data-min'));
				var max=parseFloat($(this).attr('data-max'));
				var denom=$(this).attr('data-denom') ? parseFloat($(this).attr('data-denom')) : 1;
				$(this).slider("option", { "max":max, 
											"min":min, 
											"step":step, 
											"values":[min,min]
				}) ;
				
				$(this).after('<div class="uilabels clr"><span class="p-left">'+number_format(min/denom)+'</span><span class="p-right">'+number_format(max/denom)+'</span></div>');
				 
				var input=$('#' + $(this).attr('data-target') );
				var t=$(this);
				t.on('mousedown touchstart', function() { mortgage.nowTouch = t.attr('data-target'); } );
				
				 t.find('.ui-slider-handle:first').addClass('ui-slider-handle-left').append('<span></span><i class="scale"></i>');
				 t.find('.ui-slider-handle:last').addClass('ui-slider-handle-right').append('<span></span><i class="scale"></i>');
				
				
			},
			
			change: function( event, ui ) {
				var val=number_format(ui.values[1]);
				var min=parseFloat($(this).attr('data-min'));
				var max=parseFloat($(this).attr('data-max'));
				
				$('#' + $(this).attr('data-target') ).text(val);
				
				if ( $(this).hasClass('firstpay') ) {
					var p = $('.cost').slider("values")[1] * ui.values[1] / 100;
					$('#firstSum').text(number_format(p));
				}
				
				if ( ui.values[0] > min )
					$(this).slider("values", [min, ui.values[0] ]);
				if (event.originalEvent  ) {
					mortgage.setSliders();
				}
			}, 
			slide: function( event, ui ) {
				var val=number_format(ui.values[1]);
				var min=parseFloat($(this).attr('data-min'));
				var max=parseFloat($(this).attr('data-max'));
				
				if ( $(this).hasClass('firstpay') ) {
					var p = $('.cost').slider("values")[1] * ui.values[1] / 100;
					$('#firstSum').text(number_format(p));
				}
				
				$('#' + $(this).attr('data-target') ).text(val);
				if ( ui.values[0] > min )
					$(this).slider("values", [min, ui.values[0] ]);
			},

		});
		
		mortgage.nowTouch="cost";
		mortgage.setSliders();
		mortgage.calculate();
		$('.mortgageCalc').click(function(e) {
			e.preventDefault();
			mortgage.calculate();
		});
	},
	
	setSliders: function(){
		if ( mortgage.nowTouch == "cost" || mortgage.nowTouch == "firstpay" ) {
			var sum = $('.cost').slider("values")[1] - $('.cost').slider("values")[1] * $('.firstpay').slider("values")[1] / 100;
			$(".sum").slider("values", [ parseFloat( $(".sum").attr('data-min') ) , sum ]);
		
			if ( mortgage.nowTouch == "cost" )
			{		
				var p = $('.cost').slider("values")[1] * $('.firstpay').slider("values")[1] / 100;
				$('#firstSum').text(number_format(p));
			}
		}
		
		if ( mortgage.nowTouch == "sum" ) {
			if ( $('.sum').slider("values")[1] > $('.cost').slider("values")[1] )
				$(".sum").slider("values", [ parseFloat( $(".sum").attr('data-min') ) , $('.cost').slider("values")[1] ]);
			var perc = 100 - $('.sum').slider("values")[1] / $('.cost').slider("values")[1] * 100;
			$(".firstpay").slider("values", [ parseFloat( $(".firstpay").attr('data-min') ) , perc ]);
		}
		
	},
	
	calculate: function(){
		var months = $('.years').slider("values")[1] * 12 - 1;
		var total = $('.cost').slider("values")[1] ;
		var initial = total * $('.firstpay').slider("values")[1] / 100 ;
		var credit = total - initial;
		var month_perc = $('.rate').slider("values")[1] / 1200;
		var month_payment = Math.round((credit * month_perc) / (1 - Math.pow(1 + month_perc, - months))); 

		$('.min-income span').text( number_format( month_payment * 2 ) );
		$('.month-pay span').text( number_format( month_payment ) );
	},
	
	sendCalc: function() {
		$('input[name=cost]').val( $('#cost').text() );
		$('input[name=firstpay]').val( $('#firstpay').text() );
		$('input[name=firstsum]').val( $('#firstsum').text() );
		$('input[name=sum]').val( $('#sum').text() );
		$('input[name=rate]').val( $('#rate').text() );
		$('input[name=years]').val( $('#years').text() );
		$('input[name=minincome]').val( $('.min-income span').text() );
		$('input[name=monthpay]').val( $('.month-pay span').text() );
		popup.p_show('calc_send');
	},

	printCalc: function() {
		var head = '';
		head += '<link href="/css/all.css?v=2" rel="stylesheet" type="text/css" media="all" />';
		head += '<link href="/css/print.css" rel="stylesheet" type="text/css" media="print" />';
		var content = '<html><head>' + head + '</head><body class="printable">';
		content += '<div class="body">';
		content += '<div class="head">';
		content += '<table cellpadding="0" cellspacing="0" width="100%"><tr>';
		content += '<td width="50%"><span class="logo"><img src="img/logo.png" /></span></td>';
		content += '<td width="50%" align="right"><div class="phone"><small>+7 495</small> 966 88 88<i></i></div></td>';
		content += '</tr></table>';
		content += '</div>';
		content += '<div class="mortgage-calc">';
		content += $('.mortgage-calc').html();
		content += '</div>';
		content += '<table cellpadding="0" cellspacing="0" width="100%" class="footer"><tr>';
		content += '<td width="60%">';
		content += '&copy; 2015 АН “RЯDОМ”. Полный спект услуг на рынке недвижимости.';
		content += '<br />Россия, г. Москва, Москва, Ленинский проспект, 20А, +7 495 9668888';
		content += '</td>';
		content += '<td width="40%" align="right">';
		content += 'Дизайн и разработка <a href="http://www.multiline.ru" target="_blank" title="Multiline">Multiline</a>';
		content += '</td>';
		content += '</tr></table>';
		content += '</div>';
		content += '</body></html>';
		var prwin = window.open('', 'printWin', 'width=940,height=640,toolbar=no,Scrollbars=1');
		if (typeof prwin == 'object') {
			prwin.window.focus();
			prwin.document.open();
			prwin.document.write(content);
			prwin.document.close();
			setTimeout(function() { prwin.window.print(); }, 500);
		}
	}
};

var gallery = {
	previews:null,
	moving:false,
	active:0,
	size:0,
	init: function(){
		$('.gallery-preview').append('<div class="jcarousel"><ul></ul></div>');
		if ( gallery_data.length < 5 )
			$('.control-prev, .control-next').hide();
		for( var i=0; i<gallery_data.length; i++ ) {
			$('.gallery-preview .jcarousel ul').append('<li class="slide'+i+'"><div style="background-image:url('+gallery_data[i].img_s+')"></div></li>');
			var sl=$('<div class="slide loading" id="sl'+i+'" data-img="'+gallery_data[i].img_b+'" ><div class="img"></div></div>');
			if ( gallery_data[i].title != '' )
				sl.find('div').append('<div class="title v-center"><div class="line">'+gallery_data[i].title+'</div></div>');
			
			$('.gallery-view .wrap').append(sl);
		}
		gallery.active = 0;
		gallery.size = $('.gallery-view .slide').length;		
		gallery.previews = $('.jcarousel');
		gallery.previews.on('jcarousel:reload jcarousel:create', function () {
			var width = $(this).innerWidth();
			var nw = width / 4;
			$(this).jcarousel('items').css('width', nw + 'px');
		}).jcarousel({
			wrap: 'circular'
		});
		
		$('.control-prev').jcarouselControl({ target: '-=1' });

		$('.control-next').jcarouselControl({target: '+=1' });
		
		$('.gallery-view .slide').eq(0).css('left', 0);
		$('.gallery-preview li').eq(0).addClass('active');
		
		gallery.load( $('.gallery-view .slide').eq(0) );
		gallery.load( $('.gallery-view .slide').eq(1) );
		gallery.load( $('.gallery-view .slide').eq(gallery.size - 1) );
		$('.slide-prev').click(function(e) {
			e.preventDefault();
			gallery.move('prev');
		});
		$('.slide-next').click(function(e) {
			e.preventDefault();
			gallery.move('next');
		});
		
		$('.gallery-preview li').click(function(){ 
			if( $(this).hasClass('active') ) return;
			gallery.move( $(this).attr('class') ); 
		});
		
		$(document).off('click', '.photo-zoom a, .gallery-view .slide').on('click', '.photo-zoom a, .gallery-view .slide', function(e) {
			e.preventDefault();
			var img = $('<img src="'+gallery_data[gallery.active].img_b+'" >');
			img.css( {'max-width':$(window).width()*0.9 + 'px', 'max-height': $(window).height()*0.8  + 'px'} );
			$('#photo-zoom:first').find('.win img').replaceWith(img);
			popup.p_show('photo-zoom');
		});
	},
	
	move: function(dir) {
		if (gallery.moving) return;
		gallery.moving=true;
		var i, scr=0;
		
		if ( dir=="prev" ) {
			i = gallery.active == 0 ? gallery.size-1 : gallery.active - 1;
			start = '-100%';
			end = '100%';
			gallery.previews.jcarousel('scroll', '-=1' );
		}
		else if ( dir=="next" ) {
			i = gallery.active == gallery.size-1 ? 0 : gallery.active + 1;
			start = '100%';
			end = '-100%';
			gallery.previews.jcarousel('scroll', '+=1' );
		} else {
			i = parseInt( dir.split('slide')[1] );
			if (i > gallery.active) { start = '100%'; end = '-100%'; }
			else { start = '-100%'; end = '100%'; }
		}
		
		gallery.load($('.gallery-view .slide').eq(i));

		$('.gallery-preview li').removeClass('active');
		$('.gallery-preview li.slide'+i).addClass('active');
		$('.gallery-view .slide').eq(i).css('left', start).transition({'left': 0}, 500);
		$('.gallery-view .slide').eq(gallery.active).css('left', 0).transition({'left': end}, 500, function(){
			gallery.active=i;
			gallery.moving=false;
		});

		var i_p = i == 0 ? gallery.size - 1 : i - 1;
		var i_n = i == gallery.size - 1 ? 0 : i + 1;
		gallery.load($('.gallery-view .slide').eq(i_p));
		gallery.load($('.gallery-view .slide').eq(i_n));
	},
	
	load: function(slide) {
		if ( !slide.hasClass('loading') ) return;
		var img=slide.attr('data-img');
		slide.find('.img').css('background-image', 'url('+img+')');
		slide.waitForImages({
			finished: function() {
				slide.removeClass('loading');
			}, 
			waitForAll: true
		});
	}
};


var steps = {
	albums:null,
	moving:false,
	activeView:0,
	activeAlbum:0,
	size:0,
	keys:[],
	keysphoto:[],
	init: function(){
		$('.gallery-preview').append('<div class="jcarousel"><ul></ul></div>');
		steps.keys = Object.keys(steps_data);
		steps.keys = steps.keys.reverse();

		if ( steps.keys < 5 )
			$('.control-prev, .control-next').hide();
		
		for( var i=0; i<steps.keys.length; i++ ) {
			$('.gallery-preview .jcarousel ul').append('<li class="slide'+i+'"><div style="background-image:url('+steps_data[steps.keys[i]].preview+')"> <span class="title-album">'+steps_data[steps.keys[i]].month+'</span> </div></li>');
		}
		steps.activeView = 0;
		steps.activeAlbum = 0;
		steps.loadAlbum(0);	
		steps.albums = $('.jcarousel');
		steps.albums.on('jcarousel:reload jcarousel:create', function () {
			var width = $(this).innerWidth();
			var nw = width / 4;
			$(this).jcarousel('items').css('width', nw + 'px');
		}).jcarousel({
			wrap: 'circular'
		});
		
		$('.control-prev').jcarouselControl({ target: '-=1' });

		$('.control-next').jcarouselControl({target: '+=1' });
		
		$('.slide-prev').click(function(e) {
			e.preventDefault();
			steps.move('prev');
		});
		$('.slide-next').click(function(e) {
			e.preventDefault();
			steps.move('next');
		});

		$('.gallery-preview li').click(function(){ 
			if( $(this).hasClass('active') ) return;
			var i=parseInt( $(this).attr('class').split('slide')[1] ); 
			steps.loadAlbum(i);
		});
		
		$(document).off('click', '.photo-zoom a, .gallery-view .slide').on('click', '.photo-zoom a, .gallery-view .slide', function(e) {
			e.preventDefault();
			var img = $('<img src="'+steps_data[steps.keys[steps.activeAlbum]].photos[steps.keysphoto[steps.activeView]].img_b+'" >');
			img.css( {'max-width':$(window).width()*0.9 + 'px', 'max-height': $(window).height()*0.8  + 'px'} );
			$('#photo-zoom:first').find('.win img').replaceWith(img);
			popup.p_show('photo-zoom');
		}); 
		
		$('.albums-dupl .next').click(function(e) {
			e.preventDefault();
			steps.loadAlbum(steps.activeAlbum+1);
			steps.albums.jcarousel('scroll', '+=1' );
		});
		$('.albums-dupl .prev').click(function(e) {
			e.preventDefault();
			steps.loadAlbum(steps.activeAlbum-1);
			steps.albums.jcarousel('scroll', '-=1' );
		});
	},
	
	move: function(dir) {
		if (steps.moving) return;
		steps.moving=true;
		var i, scr=0;
		
		if ( dir=="prev" ) {
			i = steps.activeView == 0 ? steps.size-1 : steps.activeView - 1;
			start = '-100%';
			end = '100%';
		}
		else if ( dir=="next" ) {
			i = steps.activeView == steps.size-1 ? 0 : steps.activeView + 1;
			start = '100%';
			end = '-100%';
		} 
		
		steps.load($('.gallery-view .slide').eq(i));

		$('.photo-counter .num').text(i+1);
		$('.gallery-view .slide').eq(i).css('left', start).transition({'left': 0}, 500);
		$('.gallery-view .slide').eq(steps.activeView).css('left', 0).transition({'left': end}, 500, function(){
			steps.activeView=i;
			steps.moving=false;
		});
		
		var i_p = i == 0 ? steps.size - 1 : i - 1;
		var i_n = i == steps.size - 1 ? 0 : i + 1;
		steps.load($('.gallery-view .slide').eq(i_p));
		steps.load($('.gallery-view .slide').eq(i_n));
	},
	
	loadAlbum: function(i){
		$('.gallery-view .wrap').html('');
		
		if (i<0) i=steps.keys.length-1;
		if (i==steps.keys.length) i=0;
		
		steps.activeAlbum=i;
		steps.activeView=0;
		steps.keysphoto = Object.keys( steps_data[steps.keys[i]].photos );
		
		$('.albums-dupl span').text(steps_data[steps.keys[i]].month);
		
		for (var j in steps_data[steps.keys[i]].photos ) {
			var item = steps_data[steps.keys[i]].photos[j];
			var sl=$('<div class="slide loading" id="sl'+i+'" data-img="'+item.img_b+'" ><div class="img"></div></div>');
			//if ( item.title != '' )
				sl.find('div').append('<div class="title v-center"><div class="line">'+item.title+'</div></div>');
			
			$('.gallery-view .wrap').append(sl);
		}
		steps.size=$('.gallery-view .slide').length;
			
		$('.gallery-view .slide').eq(0).css('left', 0);
		$('.gallery-preview li').removeClass('active');
		$('.gallery-preview li.slide'+i).addClass('active');
		$('.photo-counter').html('<span class="num">1</span> / '+steps.keysphoto.length);
			
		steps.load( $('.gallery-view .slide').eq(0) );
		steps.load( $('.gallery-view .slide').eq(1) );
		steps.load( $('.gallery-view .slide').eq(steps.size - 1) );
	},
	
	load: function(slide) {
		if ( !slide.hasClass('loading') ) return;
		var img=slide.attr('data-img');
		slide.find('.img').css('background-image', 'url('+img+')');
		slide.waitForImages({
			finished: function() {
				slide.removeClass('loading');
			}, 
			waitForAll: true
		});
	}
};

var pano= {
	init: function(){
		$('.tour__pano-point').click(function(e) {
			e.preventDefault();
			$('#pano').html('').width($(window).width()*0.9).height( $(window).height()*0.8 );
			popup.p_show('object_pano');
			
			var id=$(this).attr('data-targ');
			embedpano({
				swf:"js/krpano.swf",
				xml:"pano/pano_"+id+".xml",
				target:"pano",
				wmode:"opaque",
				"bgcolor":"#000000",
				"html5":"prefer"
			});
			
		});
	},
};
 
var vac= {
	init:function(){
		$('.vacancy__title').click(function(e) {
			var v= $(this).closest('.vacancy');
			v.siblings('.vacancy').removeClass('opened').find('.vacancy__text').slideUp(300);
			v.toggleClass('opened').find('.vacancy__text').slideToggle(300);
		});
	},
};

var flow_player = {
	init: function(is_first) {
		if (is_first) {
			$(window).load(function() {
				setTimeout(function() {
					flow_player.set_player();
				}, 500);
			});
		}
		else {
			setTimeout(function() {
				flow_player.set_player();
			}, 500);
		}
	},
	set_player: function() {
		var id = 'flow-player';
		var pl = $('#' + id);
		if (pl.attr('data-src-webm') && pl.attr('data-src-mp4')) {
			flowplayer('#' + id, {
				swf: '/js/flowplayer/flowplayer.swf',
				clip: {
					sources: [
						{type: 'video/webm', src: pl.attr('data-src-webm')},
						{type: 'video/mp4', src: pl.attr('data-src-mp4')}
					]
				}
			});
		}
		/*else if (pl.attr('data-swf') && pl.attr('data-rmpt-swf') && pl.attr('data-rmtp-url') && pl.attr('data-url') && pl.attr('data-ipad-url')) {
			flowplayer('#' + id, {
				//src: pl.attr('data-swf'),
				//wmode: 'opaque',
				swf: '/js/flowplayer/flowplayer.swf',
				plugins: {
					rtmp: {
						url: pl.attr('data-rmpt-swf'),
						netConnectionUrl: pl.attr('data-rmtp-url')
					},
					controls: {
						display: 'none'
					}
				}, 
				clip: {
					provider: 'rtmp',
					url: pl.attr('data-url'),
					live: true,
					scaling: 'fit',
					ipadUrl: pl.attr('data-ipad-url'),
					autoPlay: true
				}
			});
		}*/
	}
};

function show_photos(data, ind) {
	if (typeof(data) != 'undefined' && data.length > 0) {
		var ind = ind || 0;
		var p = $('#photo');
		if (data.length > 1) {
			p.find('.prev, .next, .num').show();
			p.find('.prev').unbind('click').bind('click', function() {
				show_photos(data, ind > 0 ? ind - 1 : data.length - 1);
			});
			p.find('.next').unbind('click').bind('click', function() {
				show_photos(data, ind < data.length - 1 ? ind * 1 + 1 : 0);
			});
		}
		if (p.hasClass('hidden')) {
			popup.p_show('photo');
		}
		p.find('.load').show();
		p.find('.title').html(data[ind].title);
		p.find('.num').html('<i>' + (ind * 1 + 1) + '</i> / ' + data.length);
		var ww = $(window).width();
		var wh = $(window).height() - p.offset().top;
		img_load(data[ind].img, function(iw, ih) {
			p.find('.load').hide();
			var iw_new = Math.min(iw, ww * 0.8);
			var c = iw_new / iw;
			var ih_new = Math.round(Math.min(ih * c, (wh - 90) * 0.8));
			c = ih_new / ih;
			var iw_new = Math.round(iw_new * c);
			var t = (wh - ih_new - 90) / 2 + $(document).scrollTop();
			var l = (ww - iw_new) / 2;
			p.find('.img_wrap').append('<img src="' + data[ind].img + '" class="img_new" />');
			p.find('.win').transition({top: t + 'px', left: l + 'px', duration: 500});
			p.find('.img_wrap').transition({width: iw_new + 'px', height: ih_new + 'px', duration: 500});
			p.find('.img_new').css({opacity: 0}).transition({'opacity': 1, duration: 500}, function() {
				p.find('.img').remove();
				p.find('.img_new').addClass('img').removeClass('img_new');
			});
		});
	}
}

function img_load(src, callback) {
	var image = document.createElement('img');
	image.src = src;
	if (image.width != 0) {
		callback(image.width, image.height);
	}
	else {
		$(image).load(function() {
			callback(image.width, image.height);
		});
	}
}

function preload_images(preload, callback) {  
	var image = document.createElement('img');
	image.src = preload.shift();
	if (preload.length == 0) {
		if (image.width != 0) {
			callback();
		}
		else {
			$(image).load(function() {
				callback();
			});
		}
	}
	else {
		preload_images(preload, callback);
	}
}

function detectIE() {
	var browser = navigator.appName;
	if (browser == "Microsoft Internet Explorer") {
		var b_version = navigator.appVersion;
		var re = /\MSIE\s+(\d+\.\d\b)/;
		var res = b_version.match(re);
		return parseInt(res[1], 10);
	}
	return false;
}

function mousePageXY(e) {
	var x = 0, y = 0;
	e = e || window.event;
	if (e.pageX || e.pageY) {
		x = e.pageX;
		y = e.pageY;
	}
	else if (e.clientX || e.clientY) {
		x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
		y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
	}
	return {"x": x, "y": y};
}

function setCookie(name, value, expires, path, domain, secure) {
	var old = getCookie(name);
	document.cookie = name + "=" + ((old && old != '') ? (old + '|') : '') + escape(value) +
	((expires) ? "; expires=" + expires : "") +
	((path) ? "; path=" + path : "") +
	((domain) ? "; domain=" + domain : "") +
	((secure) ? "; secure" : "");
}

function getCookie(name) {
	var cookie = " " + document.cookie;
	var search = " " + name + "=";
	var setStr = null;
	var offset = 0;
	var end = 0;
	if (cookie.length > 0) {
		offset = cookie.indexOf(search);
		if (offset != -1) {
			offset += search.length;
			end = cookie.indexOf(";", offset)
			if (end == -1) {
				end = cookie.length;
			}
			setStr = unescape(cookie.substring(offset, end));
		}
	}
	return setStr;
}

function number_format(number, decimals, dec_point, thousands_sep) {
	var i, j, kw, kd, km;
	if (isNaN(decimals = Math.abs(decimals))) {
		decimals = 0;
	}
	if (dec_point == undefined) {
		dec_point = ",";
	}
	if (thousands_sep == undefined) {
		thousands_sep = " ";
	}
	i = parseInt(number = (+number || 0).toFixed(decimals)) + "";
	if ((j = i.length) > 3) {
		j = j % 3;
	}
	else {
		j = 0;
	}
	km = (j ? i.substr(0, j) + thousands_sep : "");
	kw = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);
	kd = (decimals && Math.abs(number - i) > 0 ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, 0).slice(2) : "");
	return km + kw + kd;
}

function number_unformat(number) {
	return parseFloat(number.replace(',', '.').replace(' ', ''));
}

if (!$.support.transition) {
	$.fn.transition = $.fn.animate;
}
