// use lazysizes.min.js
(function() {

    // $(document).ready alternative
    var ready = function(callback) {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    };

    // document ready
    ready(function() {
        var DMY_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

        // imgタグをlazyLoad用に書き換え
        var replaceImg = function (){
            var images = document.getElementsByTagName('img'),
                src = '',
                i = 0,
                l = images.length;
            for (; i < l; i++) {
                src = images[i].src;
                images[i].src = DMY_IMG;
                images[i].setAttribute('data-src', src);
                images[i].className += ' lazyload';
            }
        };

        // 背景画像のDOMをlazyLoad用に書き換え (style=""で直接指定しているものに限る)
        var replaceBgImg = function (){
            // 動作に不安があるためスマホ用背景[data-custom-sp-bgimg-target]はtargetsに含めない
            var targets = document.getElementsByClassName('pera1-bg-editable'),
                bgStyle = '',
                i = 0,
                l = targets.length;
            for (; i < l; i++) {
                bgStyle = targets[i].style.backgroundImage;
                if (bgStyle === '') {
                    continue;
                }

                // url() 内の " はブラウザに挙動が変わる。" がある場合でもそのままdata属性に設定するために ' へ置換
                bgStyle = bgStyle.replace(/"/g, "'");
                //スマホ版でページ作成すると、document readyが2回実行されダミー画像がセットされる件への暫定対応
                if (bgStyle.indexOf('data:image/gif;base64') !== -1) {
                    continue;
                }
                targets[i].style.backgroundImage = 'url(' + DMY_IMG + ')';
                targets[i].setAttribute('data-bg', bgStyle);
                targets[i].className += ' lazyload';
            }

            // lazyload発火時にstyleを書き換える
            document.addEventListener('lazybeforeunveil', function(e){
                var bg = e.target.getAttribute('data-bg');
                if(bg){
                    e.target.style.backgroundImage = bg;
                }
            });
        };

        // smoothScrollの都合上、ページ内リンク押下時に、未スクロールだと座標がズレてしまうので、一旦imgタグのreplaceは保留
        // replaceImg();
        replaceBgImg();
    });

})();
