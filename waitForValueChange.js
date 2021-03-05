// ==UserScript==
// @name             元素属性值变更监听&回调
// @description      等待元素一些属性值改变, 然后调用传入的回调函数(基于waitForKeyElements修改而成)
// @require          http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @match            https://*
// @grant            GM_addStyle
// @grant            GM_xmlhttpRequest
// ==/UserScript==

var $ = window.jQuery;
var log = console.log;


// 实例
waitForValueChange('.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr', ['span'], valueGetter, processFunc);


// 需要我们实现的回调处理函数
function processFunc( node ) {

    log('Value change call back');
}


/*
 * @node: waitForValueChange的selectorTxt选中的节点
 * @attr: waitForValueChange的changeHint中的元素, 用于辅助获取目标属性值
 * @previous_value: 目标属性值的历史值, 未寻找到目标属性值返回该值*/
function valueGetter( node, attr, previous_value ) {

    var target_node = node.getElementsByTagName(attr)[1];
    if ( typeof target_node == 'undefined' ) return previous_value;
    if ( target_node.hasAttribute('innerHTML') ) return previous_value;
    return target_node.innerHTML;
}

/*
 * @changeHint: 监听目标的属性名或者标签名, 作为valueGetter的入参, 辅助获取目标属性值
 * @valueGetter: 用于获取属性值的回调函数
 * @actionFunction: 处理回调函数
 * @nestingFrame: 多层嵌套的iframe指示, 目标若在:iframe1->iframe2,
 *                则nestingFrame应为['#iframe1', '#iframe2'], 若只在ifram1, 则为['ifram1']
 * */
function waitForValueChange (selectorTxt, changeHint, valueGetter, actionFunction, nestingFrame ) {
    var targetNodes;

    if ( typeof nestingFrame != "undefined" ) {
        var current_content = $(nestingFrame[0]).contents();
        for ( var i=1; i<nestingFrame.length; i++){
            current_content = current_content.find(nestingFrame[i]).contents();
        }
        targetNodes = current_content.find(selectorTxt);
    }
    else {
        targetNodes = $(selectorTxt);
    }

    var controlObj = waitForValueChange.controlObj || {};
    var controlKey = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl = controlObj [controlKey];

    if (targetNodes && targetNodes.length > 0) {
        targetNodes.each ( function () {
            var jThis = $(this);
            var previous_value;
            var current_value;
            for ( var attr of changeHint ) {
                previous_value = controlObj[attr];
                current_value = valueGetter( jThis[0], attr, previous_value );
                controlObj[attr] = current_value;
                if ( current_value != previous_value ) {
                    actionFunction (jThis);
                }
            }

        } );
    }

    if ( !timeControl ) {
        timeControl = setInterval ( function () {
            waitForValueChange ( selectorTxt,
                changeHint,
                valueGetter,
                actionFunction,
                nestingFrame,
            );
        },
            300
        );
        controlObj[controlKey] = timeControl;
    }
    waitForValueChange.controlObj = controlObj;
}
