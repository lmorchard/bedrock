/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
;(function(w, $, TweenMax, TimelineLite, Power2, Quad) {
    'use strict';

    w.ga_track('');

    var $article_wrapper = $('#article-wrapper');
    var article_height = 820;
    var parallax_offset = 142;
    var phone_offset = 200; // distance from top of article to top of phone
    var phone_speed = 400; // ms phone movement speed between articles

    var $os_giantfox = $('#os .giantfox');
    var $os_giantfox_tail = $('#os .giantfox .giantfox-foreground');
    var $marketplace_giantfox = $('#marketplace .giantfox');
    var $marketplcae_giantfox_tail = $('#marketplace .giantfox .giantfox-foreground');
    var $android_tablet = $('#android .android-tablet');
    var $phone = $('#phone-common');
    var $phone_android = $('#phone-android');
    var $phone_shadows = $('.phone-shadow');
    var $overview = $('#overview');
    var $os = $('#os');
    var $marketplace = $('#marketplace');
    var $android = $('#android');

    // set phone position (needs to be in inline style object for retrieval later)
    $phone.css('left', '50%');

    // set up foxtail sprite animation
    $('#foxtail').sprite({fps: 12, no_of_frames: 44, rewind: true});

    // Smooth scroll-to for left menu navigation
    $('#partner-menu a, #nav-main-menu a, a.nav').click(function(e) {
        var elementClicked = $(this).attr("href");
        var destination;

        // all <article>'s have set height and position
        switch (elementClicked) {
            case '#overview':
                destination = 0;
                break;
            case '#os':
                destination = (article_height - parallax_offset);
                break;
            case '#marketplace':
                destination = ((article_height * 2) - (parallax_offset * 2));
                break;
            case '#android':
                destination = ((article_height * 3) - (parallax_offset * 3));
                break;
        }

        // reset phone & giantfox
        $phone.animate({ 'left': '50%' }, phone_speed);
        $phone_android.animate({ 'left': '50%' }, phone_speed);
        $os_giantfox.css('margin-left', '-70px');
        $marketplace_giantfox.css('margin-left', '-40px');
        $android_tablet.css('margin-left', '-40px');

        // force all first sections to be current
        $('.partner-article').each(function(i, article) {
            $(article).attr('data-section', $(article).find('section:first').attr('id'));
            $(article).find('section').each(function(j, section) {
                $(section).css('left', (j * 100) + '%').attr('data-current', ((j === 0) ? 1 : 0));
            });
        });

        // slow-ish scrolling to make scroll animation life easier
        $("html:not(:animated),body:not(:animated)").animate({ scrollTop: destination }, 1000);

        var virtual_page = (elementClicked !== '#overview') ? elementClicked.replace(/#/, '') + '/' : '';

        w.ga_track(virtual_page);

        return false;
    });

    // if hash changes, make sure parallax doesn't go haywire
    var _handle_hash = function() {
        if (window.location.hash !== '') {
            $article_wrapper.animate({ scrollTop: 0 }, 100, function() {
                $('#partner-nav a[href="' + window.location.hash + '"]').trigger('click');
                w.location.hash = '';
            });
        }
    };

    // fix for loading page with anchor in URL
    $(function() {
        setTimeout(function() {
            _handle_hash();
        }, 60); // may need to increase timeout?
    });

    $(w).on('hashchange', function() {
        _handle_hash();
    });

    var _toggle_form = function() {
        var $menu = $('#overlay-menu');

        $menu.toggleClass('form-open');

        if (!$menu.hasClass('form-open')) {
            $.pageslide.close();
        } else {
            w.ga_track('form/');
        }
    };

    // move form out of overlay and into its own container for side slider
    var $form = $('#form').detach();
    $form.hide();
    $article_wrapper.after($form);
    $form.find('.close').click(function() {
        _toggle_form();
    });

    // re-arrange news, partner button, & links if #overview
    var $overview_news = $('#overview-news').detach();
    $('#more-partners').after($overview_news);
    $overview_news.fadeIn('fast');

    var $overview_actions= $('#overview .overview-actions').detach();
    $('#overview-news').after($overview_actions);
    $overview_actions.fadeIn('fast');

    var $overview_partner= $('#overview .partner-button').detach();
    $('#overview .partner-logos').after($overview_partner);
    $overview_partner.fadeIn('fast');

    // activate form drawer
    $('.toggle-form').off().on('click', function() {
        _toggle_form();
    }).pageslide({
        direction: 'left',
        modal: true,
        speed: 300
    });

    // side scrolling sections
    $('.view-section').on('click', function(e) {
        e.preventDefault();

        // needed to calculate percentage offsets?
        var doc_width = $(w.document).width();

        var link = $(this);

        var article = link.parents('article:first');

        // which section is currently displayed?
        var orig = article.find('section[data-current="1"]:first');
        var orig_pos = Number(orig.data('pos'));

        // which section are we going to?
        var dest = $('#' + link.data('section'));
        var dest_pos = Number(dest.data('pos'));

        // what's the difference in position? multiply by 100 to get percentage
        var delta = (dest_pos - orig_pos) * 100;

        article.find('section').each(function(i, el) {
            var section = $(el);

            // percentage position of this section
            // (left will be in px and will be multiple of doc_width)
            var el_left = (section.position().left/doc_width) * 100;

            // make sure we round to the nearest 100
            var new_left = Math.round((el_left - delta)/100)*100;

            section.css('left', new_left + '%').attr('data-current', 0);
        });

        // update current section
        dest.attr('data-current', 1);

        // update parent article selector
        article.attr('data-section', dest.attr('id'));

        // which phone should we move?
        var $cur_phone = (article.attr('id') === 'android') ? $phone_android : $phone;

        // slide phone?
        if (dest_pos > 1) {
            $cur_phone.stop().animate({ 'left': '-50%' }, phone_speed);
        } else {
            $cur_phone.stop().animate({ 'left': '50%' }, phone_speed);
        }

        // track section view
        var virtual_page = article.attr('id') + '/';

        // only add sub-section id if not in first position
        if (dest_pos > 1) {
            virtual_page += dest.attr('id') + '/';
        }

        w.ga_track(virtual_page);
    });

    // custom horizontal movement of large background graphics
    $('a[data-section="os-operators"]').on('click', function() {
        $os_giantfox.css('margin-left', '-1380px');
    });

    $('a[data-section="os-overview"]').on('click', function() {
        $os_giantfox.css('margin-left', '-70px');
    });

    $('a[data-section="marketplace-developers"]').on('click', function() {
        $marketplace_giantfox.css('margin-left', '-2120px');
    });

    $('a[data-section="marketplace-operators"]').on('click', function() {
        $marketplace_giantfox.css('margin-left', '-1120px');
    });

    $('a[data-section="marketplace-overview"]').on('click', function() {
        $marketplace_giantfox.css('margin-left', '-40px');
    });

    $('a[data-section="android-partner"]').on('click', function() {
        $android_tablet.css('margin-left', '-1520px');
    });

    $('a[data-section="android-overview"]').on('click', function() {
        $android_tablet.css('margin-left', '-40px');
    });

    // show/hide phone shade and set phone screen contents
    var _refresh_phone = function(to_slide, shadowinout) {
        var shadow = to_slide.find('.phone-shadow');
        if (shadowinout === 'in') {
            shadow.addClass('visible');
        } else {
            shadow.removeClass('visible');
        }

        var $visible = $('.screen:visible:first');

        if ($visible.attr('id') !== ('screen-' + to_slide.attr('id'))) {
            $('#screen-' + to_slide.attr('id')).fadeIn('fast', function() {
                $visible.hide();
            });
        }
    };

    // pretty complex function to move phone with scrolling/click nav
    var _move_phone = function(factor, slide, new_z) {
        // fade out all phone shadows
        $phone_shadows.removeClass('visible');

        // chaining animations gets too crazy
        // make sure only one animation is running/queued at one time
        if ($phone.is(':animated')) {
            $phone.stop();

            // if phone is in between hiding/showing, force that to finish immediately
            if (Number($phone.attr('data-hiding')) === 1) {
                $phone.css('left', '-50%');
                $phone.attr('data-hiding', 0);
            } else if (Number($phone.attr('data-showing')) === 1) {
                $phone.css('left', '50%');
                $phone.attr('data-showing', 0);
            }
        }

        // set current article for inherited body styles
        $('body').attr('data-article', slide.attr('id'));

        // set active left menu item
        $('#partner-menu li').removeClass('active');
        $('#partner-menu li[id="menu-' + slide.attr('id') + '"]').addClass('active');

        // phone is visible if at 50% left
        var cur_left = $phone[0].style.left;
        var visible = (cur_left === '50%');

        // calculate new top position for phone
        var top_pos = ((article_height * factor) - (parallax_offset * factor)) + phone_offset;

        // scrolling to android slide should never affect standard phone's left or z-index
        if (slide.attr('id') === 'android') {
            $phone.animate({ 'top': top_pos + 'px' }, phone_speed);
        } else {
            // would like to abstract this more, but each scenario requires specific sequencing
            if (Number(slide.find('section:first').attr('data-current')) === 1) {
                if (!visible) {
                    if (new_z) {
                        $phone.css('z-index', new_z);
                    }

                    $phone.animate({
                        top: top_pos
                    }, 100, function() {
                        $phone.attr('data-showing', 1);

                        _refresh_phone(slide, 'in');

                        $phone.animate({ 'left': '50%' }, phone_speed, function() {
                            $phone.attr('data-showing', 0);
                        });
                    });
                } else {
                    _refresh_phone(slide, 'in');

                    $phone.animate({ 'top': top_pos + 'px' }, phone_speed, function() {
                        if (new_z) {
                            $phone.css('z-index', new_z);
                        }
                    });
                }
            } else {
                if (visible) {
                    $phone.attr('data-hiding', 1);

                    _refresh_phone(slide, 'out');

                    $phone.animate({
                        'left': '-50%'
                    }, phone_speed, function() {
                        $phone.attr('data-hiding', 0);
                        $phone.css('top', top_pos + 'px');

                        if (new_z) {
                            $phone.css('z-index', new_z);
                        }
                    });
                } else {
                    if (new_z) {
                        $phone.css('z-index', new_z);
                    }

                    _refresh_phone(slide, 'out');

                    $phone.animate({ 'top': top_pos + 'px' }, phone_speed);
                }
            }
        }
    };

    // set up parallax tweening
    var controller = $.superscrollorama();

    var tweens = {};

    // generic tween used for most article content
    tweens.slide_up = {
        from: {
            css: { top: 120, opacity: 0 },
            immediateRender: true
        },
        to: { css: { top: 0, opacity: 1 } }
    };

    // article specific tweens
    tweens.article_overview = {
        from: {
            css: { top: 0 },
            immediateRender: true
        },
        to: {
            css: { top: 0 },
            onReverseComplete: function() {
                _move_phone(0, $overview);
            }
        }
    };

    tweens.article_os = {
        from: {
            css: { top: 0, ease: Power2.easeOut },
            immediateRender: true
        },
        to: {
            css: { top: (parallax_offset*-1) },
            onStart: function() {
                $phone.css('z-index', 110);
            },
            onComplete: function() {
                _move_phone(1, $os);
            }
        }
    };

    tweens.article_marketplace = {
        from: {
            css: { top: (parallax_offset*-1), ease: Power2.easeOut },
            immediateRender: true
        },
        to: {
            css: { top: (parallax_offset*-2) },
            onStart: function() {
                $phone.css('z-index', 120);
            },
            onComplete: function() {
                _move_phone(2, $marketplace);
            },
            onReverseComplete: function() {
                _move_phone(1, $os, 110);
            }
        }
    };

    tweens.article_android = {
        from: {
            css: { top: (parallax_offset*-2), ease: Power2.easeOut },
            immediateRender: true
        },
        to: {
            css: { top: (parallax_offset*-3) },
            onComplete: function() {
                _move_phone(3, $android);
                $phone_android.addClass('android-phone-visible');
            },
            onReverseComplete: function() {
                _move_phone(2, $marketplace);
                $phone_android.removeClass('android-phone-visible');
            }
        }
    };

    var prev_article = '#overview';

    // set up tweens for contents of each article (except #overview)
    $('.partner-article').each(function(i, article) {
        var $article = $(article);

        var my_tweens = [], tween, $tweener;

        // #overview takes longer so it finishes last - needed to handle super
        // fast scrolling upwards
        var dur = ($article.attr('id') === 'overview') ? 1.6 : 0.5;

        tween = TweenMax.fromTo(
            $article,
            dur,
            tweens['article_' + $article.attr('id')].from,
            tweens['article_' + $article.attr('id')].to
        );

        my_tweens.push(tween);

        // build tween for each element in $article with class of tween
        $article.find('.tween').each(function(i, tweener) {
            $tweener = $(tweener);

            tween = TweenMax.fromTo(
                $tweener,
                0.6,
                tweens.slide_up.from,
                tweens.slide_up.to
            );

            my_tweens.push(tween);
        });

        if (my_tweens.length > 0) {
            // add the tween when the previous article is 600px away from being "in view"
            // (which i think means horizontal middle of viewport)
            controller.addTween(
                prev_article,
                (new TimelineLite()).append(my_tweens),
                300, // scroll duration
                600 // start offset
            );
        }

        if ($article.attr('id') !== 'overview') {
            prev_article = '#' + $article.attr('id');
        }
    });
})(window, window.jQuery, window.TweenMax, window.TimelineLite, window.Power2, window.Quad);

