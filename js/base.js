;(function () {
    'use strict';
    var $form_add_task = $('.add-task')
        , $window = $(window)
        , task_list = []
        , $task_delete_trigger
        , $task_detail_trigger
        , $task_detail = $('.task-detail')
        , $task_detail_mask = $('.task-detail-mask')
        , $update_form
        , $task_detail_content
        , $task_detail_content_input
        , $checkbox_complete
        , $msg = $('.msg')
        , $msg_content = $msg.find('.msg-content')
        , $msg_confirm = $msg.find('button')
        , $alerter = $('.alerter')
    ;

    init();


    /*监听提交按钮*/
    $form_add_task.on('submit', on_add_task_form_submit);
    $task_detail_mask.on('click', hide_task_detail);

    function pop() {
        var $box
            , $mask
            , $content
            , $confirm
            , $cancel
            , dfd
            , timer
            , confirmed
        ;

        dfd = $.Deferred();


        /*alert*/
        $box = $('.pop-box');
        $content = $box.find('.pop-content');
        $confirm = $content.find('button.confirm');
        $cancel = $content.find('button.cancel');
        $mask = $('.pop-box-mask');

        timer = setInterval(function () {
            if (confirmed !== undefined) {
                dfd.resolve(confirmed);
                /*获取确定或取消后不再轮询*/
                clearInterval(timer);
                dismiss_pop();
            }
        }, 50);

        $confirm.on('click', on_confirmed);

        $cancel.on('click', on_cancel);
        $mask.on('click', on_cancel);

        /*取消删除*/
        function on_cancel() {
            confirmed = false;
        }

        /*确认删除*/
        function on_confirmed() {
            console.log(1);
            confirmed = true;
        }

        function dismiss_pop() {
            $mask.hide();
            $box.hide();
        }

        /*alert居中*/
        function adjust_box_position() {
            var window_width = $window.width()
                , window_height = $window.height()
                , box_width = $box.width()
                , box_height = $box.height()
                , move_x
                , move_y
            ;
            move_x = (window_width - box_width) / 2;
            move_y = ((window_height - box_height) / 2) - 20;
            $box.css({
                left: move_x,
                top: move_y
            })
        }

        /*当用户调整缩放时调用函数实现alert动态居中*/
        $window.on('resize', function () {
            adjust_box_position()
        });

        $mask.show();
        $box.show();
        /*触发第一次alert居中*/
        $window.resize();
        return dfd.promise();
    }

    /*监听关闭提示*/
    function listen_msg_event() {
        $msg_confirm.on('click', function () {
            hide_msg();
        })
    }

    /*提交事件*/
    function on_add_task_form_submit(e) {
        var new_task = {}, $input;
        e.preventDefault();
        $input = $(this).find('input[name=content]');
        new_task.content = $input.val();
        if (!new_task.content) return;
        $alerter.get(1).play();
        if (add_task(new_task)) {
            $input.val(null);
        }
    }

    /*查找并监听所有详情按钮的点击事件*/
    function listen_task_detail() {
        var index;
        $('.task-item').on('dblclick', function () {
            index = $(this).data('index');
            show_task_detail(index);
        });

        $task_detail_trigger.on('click', function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            index = $item.data('index');
            show_task_detail(index);
        })
    }

    /*监听checkbox事件,跟踪complete属性*/
    function listen_checkbox_complete() {
        $checkbox_complete.on('click', function () {
            var $this = $(this);
            var index = $this.parent().parent().data('index');
            var item = get(index);
            if (item && item.complete) {/*有item.complete,则设为false*/
                update_task(index, {complete: false});
                $alerter.get(5).play();
            }
            else {/*没有item.complete,则设为true*/
                update_task(index, {complete: true});
                $alerter.get(4).play();
            }
        })
    }

    function get(index) {
        return store.get('task_list')[index];
    }

    /*显示task_detail 和task_detail_mask*/
    function show_task_detail(index) {
        /*生成详情模板*/
        render_task_detail(index);
        $task_detail.show();
        $task_detail_mask.show();
    }

    /*更新task*/
    function update_task(index, data) {
        if (!index || !task_list[index])
            return;
        /*合并*/
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }

    /*隐藏task_detail 和task_detail_mask*/
    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    /*渲染指定task的详细信息*/
    function render_task_detail(index) {
        if (index === undefined || !task_list[index])
            return;
        var item = task_list[index];
        var tpl =
            '<form>' +
            '<div class="content">' +
            item.content +
            '</div>' +
            '<div class="input-item">' +
            '<input style="display:none;" autocomplete="off" type="text" name="content" value="' + (item.content || '') + '"></div>' +
            '<div>' +
            '<div class="desc input-item">' +
            '<textarea name="desc">' + (item.desc || '') + '</textarea>' +
            '</div>' +
            '</div>' +
            '<div class="remind input-item">' +
            '<label>remind time</label>' +
            '<input class="datetime" type="text" autocomplete="off" name="remind_date" value="' + (item.remind_date || '') + '">' +
            '</div>' +
            '<div class="task-detail-button"><button type="submit">update</button></div>' +
            '</form>';

        /*替换模板*/
        $task_detail.html(null);
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();
        /*选中form,之后要监听submit事件*/
        $update_form = $task_detail.find('form');
        /*选中task内容元素(不能更改)*/
        $task_detail_content = $update_form.find('.content');
        /*选中task内容元素(input)*/
        $task_detail_content_input = $update_form.find('[name=content]');
        /*双击显示input*/
        $task_detail_content.on('dblclick', function () {
            $task_detail_content.hide();
            $task_detail_content_input.show();
        });
        /*更新task*/
        $update_form.on('submit', function (e) {
            e.preventDefault();
            var data = {};
            /*获取表单中各个input的值*/
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            update_task(index, data);
            $alerter.get(2).play();
            $task_detail.hide();
            $task_detail_mask.hide();
        })

    }

    /*查找并监听所有删除按钮的点击事件*/
    function listen_task_delete() {
        $task_delete_trigger.on('click', function () {
            var $this = $(this);
            /*找到删除按钮所在的task元素*/
            var $item = $this.parent().parent();
            /*提取data-index*/
            var index = $item.data('index');
            /*自定义删除确认*/
            pop().then(function(r){
                r ? delete_task(index) : null;
            });

        })
    }

    function init() {
        // store.clear();
        task_list = store.get('task_list') || [];
        listen_msg_event();
        if (task_list.length)
            render_task_list();
        task_remind_check()
    }

    function task_remind_check() {
        var current_timestamp;
        /*每300ms监控数据变化*/
        var itl = setInterval(function () {
            for (var i = 0; i < task_list.length; i++) {
                var item = get(i), task_timestamp;
                if (!item || !item.remind_date || item.informed)
                    continue;
                /*设置当前时间戳*/
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if (current_timestamp - task_timestamp >= 1) {
                    update_task(i, {informed: true});
                    show_msg(item.content);
                }

            }
        }, 300);
    }

    /*提醒*/
    function show_msg(msg) {
        if (!msg) return;
        $msg_content.html(msg);
        /*
        播放提示音
        $alerter.get(0)获取.alerter内容
        */
        $alerter.get(0).play();
        $msg.show();
    }

    function hide_msg() {
        $msg.hide();
    }

    /*更新task_list*/
    function add_task(new_task) {

        /*将新task推入task_list*/
        task_list.push(new_task);
        /*更新localstorage*/
        refresh_task_list();
        return true;
    }

    /*刷新localstorage数据并渲染tpl*/
    function refresh_task_list() {
        /*更新localstorage*/
        store.set('task_list', task_list);
        render_task_list();
    }

    /*渲染所有模板*/
    function render_task_list() {
        var $task_list = $('.task-list');
        var complete_items = [];
        $task_list.html('');
        for (var i = 0; i < task_list.length; i++) {
            var item = task_list[i];
            /*如果已完成*/
            if (item && item.complete)
                complete_items[i] = item;
            else
            /*渲染未完成task*/
                var $task = render_task_item(item, i);
            /*未完成task插入至整个task_list头部*/
            $task_list.prepend($task);
        }

        for (var j = 0; j < complete_items.length; j++) {
            /*渲染已完成task*/
            $task = render_task_item(complete_items[j], j);
            if (!$task) continue;
            $task.addClass('completed');
            /*
            已完成的task插入整个task_list尾部
            每次checkbox状态变化这个循环都会执行
            */
            $task_list.append($task);
        }

        /*这个条目是动态生成的不能放在全局*/
        $task_delete_trigger = $('.glyphicon.glyphicon-trash');
        $task_detail_trigger = $('.glyphicon.glyphicon-list-alt');
        $checkbox_complete = $('.task-list .complete');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }

    /*渲染单条task*/
    function render_task_item(data, index) {
        if (!data || index === undefined) return;
        var list_item_tpl =
            /*自定义属性 data-index 用于标识task item
            HTML5标准规定，自定义的属性都已data—*开头*/
            '<div class="task-item" data-index="' + index + '">' +
            '<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
            '<span class="glyphicon glyphicon-list-alt" aria-hidden="true"></span>' +
            '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>' +
            '</span>' +
            '</div>';
        return $(list_item_tpl);
    }

    /*删除一条task*/
    function delete_task(index) {
        /*如果没有index或者index不存在则返回*/
        if (index === undefined || !task_list[index]) return;
        delete task_list[index];
        /*更新localstorage*/
        refresh_task_list();
        $alerter.get(3).play();
    }
})();