// Pretext 文本布局引擎 - 浏览器版本
// 基于 @chenglou/pretext (https://github.com/chenglou/pretext)

const pretext=(function(){
  'use strict';
  
  // 缓存
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d');
  const segmenter=new Intl.Segmenter('zh',{granularity:'word'});
  const graphemeSegmenter=new Intl.Segmenter('zh',{granularity:'grapheme'});
  const cache=new Map();
  
  // 测量文本宽度
  function measureText(text,font){
    ctx.font=font;
    return ctx.measureText(text).width;
  }
  
  // 准备文本（分段 + 测量）
  function prepare(text,font,options={}){
    const key=text+'|'+font;
    if(cache.has(key))return cache.get(key);
    
    const segments=[...segmenter.segment(text)];
    const widths=segments.map(s=>measureText(s.segment,font));
    
    const result={text,segments,widths,font,options};
    cache.set(key,result);
    return result;
  }
  
  // 带分段的准备
  function prepareWithSegments(text,font,options={}){
    return prepare(text,font,options);
  }
  
  // 布局计算
  function layout(prepared,maxWidth,lineHeight){
    if(!prepared.segments||prepared.segments.length===0){
      return{lineCount:0,height:0};
    }
    
    let lines=0;
    let currentWidth=0;
    let firstInLine=true;
    
    for(let i=0;i<prepared.segments.length;i++){
      const seg=prepared.segments[i];
      const w=prepared.widths[i];
      
      if(seg.segment==='\n'){
        lines++;
        currentWidth=0;
        firstInLine=true;
        continue;
      }
      
      if(currentWidth+w>maxWidth&&!firstInLine){
        lines++;
        currentWidth=w;
      }else{
        currentWidth+=w;
      }
      firstInLine=false;
    }
    
    if(currentWidth>0)lines++;
    
    return{lineCount:lines,height:lines*lineHeight};
  }
  
  // 带行信息的布局
  function layoutWithLines(prepared,maxWidth,lineHeight){
    if(!prepared.segments||prepared.segments.length===0){
      return{lineCount:0,height:0,lines:[]};
    }
    
    const lines=[];
    let currentLine='';
    let currentWidth=0;
    let firstInLine=true;
    
    for(let i=0;i<prepared.segments.length;i++){
      const seg=prepared.segments[i];
      const w=prepared.widths[i];
      
      if(seg.segment==='\n'){
        if(currentLine)lines.push({text:currentLine.trim(),width:currentWidth});
        currentLine='';
        currentWidth=0;
        firstInLine=true;
        continue;
      }
      
      if(currentWidth+w>maxWidth&&!firstInLine){
        lines.push({text:currentLine.trim(),width:currentWidth});
        currentLine=seg.segment;
        currentWidth=w;
      }else{
        currentLine+=seg.segment;
        currentWidth+=w;
      }
      firstInLine=false;
    }
    
    if(currentLine.trim())lines.push({text:currentLine.trim(),width:currentWidth});
    
    return{lineCount:lines.length,height:lines.length*lineHeight,lines};
  }
  
  return{prepare,prepareWithSegments,layout,layoutWithLines};
})();

// 全局导出
window.pretext=pretext;
