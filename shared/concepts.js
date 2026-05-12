// Shared concept metadata for the graph browser and lesson modules.
(function(){
'use strict';

const imageByConcept = {
  '整数加减法':'assets/concepts/place-value-tower.webp',
  '整数乘法':'assets/concepts/decimal-multiply.webp',
  '整数除法':'assets/concepts/fraction-meaning.webp',
  '位置值':'assets/concepts/place-value-tower.webp',
  '小数的意义':'assets/concepts/place-value-tower.webp',
  '整数四则运算':'assets/concepts/equation-balance.webp',
  '矩形面积':'assets/concepts/polygon-area.webp',
  '等式的性质':'assets/concepts/equation-balance.webp',
  '图形认知':'assets/concepts/polygon-area.webp',
  '数据收集':'assets/concepts/statistics-trend.webp',
  '单位换算':'assets/concepts/place-value-tower.webp',
  '轴对称与旋转':'assets/concepts/polygon-area.webp',
  '小数乘法':'assets/concepts/decimal-multiply.webp',
  '小数除法':'assets/concepts/decimal-multiply.webp',
  '因数和倍数':'assets/concepts/number-theory-sieve.webp',
  '235的倍数特征':'assets/concepts/number-theory-sieve.webp',
  '循环小数':'assets/concepts/decimal-multiply.webp',
  '观察物体':'assets/concepts/volume-cubes.webp',
  '质数与合数':'assets/concepts/number-theory-sieve.webp',
  '简易方程':'assets/concepts/equation-balance.webp',
  '长方体和正方体':'assets/concepts/volume-cubes.webp',
  '平行四边形面积':'assets/concepts/polygon-area.webp',
  '体积和体积单位':'assets/concepts/volume-cubes.webp',
  '长方体体积':'assets/concepts/volume-cubes.webp',
  '三角形面积':'assets/concepts/polygon-area.webp',
  '容积和容积单位':'assets/concepts/volume-cubes.webp',
  '梯形面积':'assets/concepts/polygon-area.webp',
  '组合图形面积':'assets/concepts/polygon-area.webp',
  '分数的意义':'assets/concepts/fraction-meaning.webp',
  '分数基础':'assets/concepts/fraction-meaning.webp',
  '真分数和假分数':'assets/concepts/fraction-meaning.webp',
  '可能性':'assets/concepts/application-strategy.webp',
  '植树问题':'assets/concepts/application-strategy.webp',
  '分数的基本性质':'assets/concepts/fraction-meaning.webp',
  '约分':'assets/concepts/fraction-meaning.webp',
  '通分':'assets/concepts/fraction-meaning.webp',
  '分数加减法':'assets/concepts/fraction-meaning.webp',
  '分数与小数互化':'assets/concepts/fraction-meaning.webp',
  '折线统计图':'assets/concepts/statistics-trend.webp',
  '找次品':'assets/concepts/application-strategy.webp'
};

const visualByConcept = {
  '整数加减法':['➕','数块在天平上进出，数量随操作变多或变少','同单位计数'],
  '整数乘法':['✖️','一排排同样多的方块，乘法就是等量分组','等量分组'],
  '整数除法':['🍕','把一张饼公平分给几个人，或看能分成几组','平均分'],
  '位置值':['🏗️','进位塔：10个小方块升成1根十条，10根十条升成1个百块','进位塔'],
  '小数的意义':['🔬','把1继续切成十分之一、百分之一，数轴被放大','放大小单位'],
  '整数四则运算':['🧭','运算路线图：括号先走，乘除再走，加减最后走','运算顺序'],
  '矩形面积':['▦','单位正方形铺满长方形，面积就是铺了多少个格子','单位铺砖'],
  '等式的性质':['⚖️','天平两边同时做同一件事，平衡不被破坏','平衡保持'],
  '图形认知':['🔷','边和角组成图形骨架，先认清形状再谈公式','形状骨架'],
  '分数基础':['🥧','一个整体被平均切开，取其中几份','切蛋糕'],
  '数据收集':['📋','把杂乱数据装进格子，才能看清规律','数据装盒'],
  '单位换算':['🪜','沿单位阶梯上下来回走，每一级都有固定进率','单位阶梯'],
  '轴对称与旋转':['🪞','镜子和转盘：图形变了位置，但结构保持','镜像转盘'],
  '小数乘法':['📏','数轴上一次次跳同样长，计数单位变小后再组合','小数跳跃'],
  '小数除法':['🔁','把除数变成整数，整条算式一起换单位','换单位机器'],
  '因数和倍数':['🧩','一块数板能被哪些小块正好拼满','整除拼图'],
  '235的倍数特征':['🔍','观察个位和数字和，像用筛子筛出倍数','倍数筛子'],
  '循环小数':['♻️','除法走廊里不断重复出现同一段图案','循环轨道'],
  '观察物体':['👁️','从前、上、左三束光照出同一个立体的影子','三视图'],
  '质数与合数':['💎','质数像不可再拆的原子块，合数能继续分解','数字原子'],
  '简易方程':['⚖️','未知数藏在天平一侧，通过平衡一步步找出来','未知天平'],
  '长方体和正方体':['📦','六个面围成盒子，棱和顶点撑起空间','空间盒子'],
  '平行四边形面积':['✂️','剪下三角形平移过去，歪形变成长方形','剪拼转化'],
  '体积和体积单位':['🧊','用小立方体填满空间，体积就是填了多少块','空间填充'],
  '长方体体积':['🧱','一层格子乘以层数，长宽高共同计数','层层堆叠'],
  '三角形面积':['🔺','两个一样的三角形拼成平行四边形，一个只占一半','双拼一半'],
  '容积和容积单位':['🥛','容器里面能装多少空间，外壳不是重点','内部空间'],
  '梯形面积':['🪁','两个一样的梯形倒扣拼成平行四边形','双梯拼合'],
  '组合图形面积':['🧩','把复杂形状切成已知图形，再加减拼回整体','分割添补'],
  '分数的意义':['🥧','蛋糕、分数条、一组球都能成为单位1','单位1'],
  '真分数和假分数':['🍰','一块以内是真分数，超过一整块就是假分数','超过整体'],
  '可能性':['🎲','骰子和转盘上，每种结果占一块可能区域','机会区域'],
  '植树问题':['🌳','路上先数间隔，再决定端点有没有树','间隔端点'],
  '分数的基本性质':['🪄','同一段长度切得更细，取的份数也同比变多','等值切分'],
  '约分':['🧹','把共同倍数清扫掉，保留最简的同等大小','清扫公因数'],
  '通分':['🔧','把不同分数单位调成同一种单位再比较计算','统一单位'],
  '分数加减法':['🧮','分数单位相同才能直接数份数，不同先通分','同单位相加'],
  '分数与小数互化':['🔄','同一个数在分数尺和小数尺之间来回翻译','双语数字'],
  '折线统计图':['📈','把一串数据点连起来，看趋势怎样升降','趋势山脊'],
  '找次品':['⚖️','用天平每次把可能性切成几组，最快缩小范围','策略分组']
};

function withHash(path,name){
  return `${path}#${encodeURIComponent(name)}`;
}

const lessonByConcept = {
  '整数乘法':{href:withHash('modules/01-decimal-multiply/1-1-int-multiply.html','整数乘法'),label:'进入小数 × 整数课件',meta:'乘法意义迁移'},
  '小数乘法':{href:withHash('modules/01-decimal-multiply/index.html','小数乘法'),label:'进入小数乘法模块',meta:'2 个互动课件'},
  '矩形面积':{href:withHash('modules/06-polygon-area/index.html','矩形面积'),label:'进入多边形面积模块',meta:'面积推导基础'},
  '平行四边形面积':{href:withHash('modules/06-polygon-area/6-1-parallelogram.html','平行四边形面积'),label:'进入平行四边形面积课件',meta:'剪拼转化'},
  '三角形面积':{href:withHash('modules/06-polygon-area/6-2-triangle.html','三角形面积'),label:'进入三角形面积课件',meta:'双拼一半'},
  '梯形面积':{href:withHash('modules/06-polygon-area/6-3-trapezoid.html','梯形面积'),label:'进入梯形面积课件',meta:'拼合推导'},
  '组合图形面积':{href:withHash('modules/06-polygon-area/index.html','组合图形面积'),label:'进入多边形面积模块',meta:'3 个互动课件'},
  '整数除法':{href:withHash('modules/14-fraction-meaning/14-2-division.html','整数除法'),label:'进入分数与除法课件',meta:'除法与分数线'},
  '分数基础':{href:withHash('modules/14-fraction-meaning/index.html','分数基础'),label:'进入分数意义模块',meta:'3 个互动课件'},
  '分数的意义':{href:withHash('modules/14-fraction-meaning/14-1-meaning.html','分数的意义'),label:'进入分数的意义课件',meta:'单位1'},
  '分数的基本性质':{href:withHash('modules/14-fraction-meaning/14-3-property.html','分数的基本性质'),label:'进入分数基本性质课件',meta:'等值切分'},
  '位置值':{href:withHash('modules/04-place-value/4-1-place-value.html','位置值'),label:'进入位置值课件',meta:'十进制计数法'},
  '小数除法':{href:withHash('modules/02-dec-division/2-1-dec-division.html','小数除法'),label:'进入小数除法课件',meta:'商不变'},
  '简易方程':{href:withHash('modules/05-equations/5-1-simple-equations.html','简易方程'),label:'进入简易方程课件',meta:'天平思维'},
  '体积和体积单位':{href:withHash('modules/07-volume/7-1-volume-units.html','体积和体积单位'),label:'进入体积课件',meta:'立方计数'},
  '长方体和正方体':{href:withHash('modules/07-volume/7-2-cuboid.html','长方体和正方体'),label:'进入长方体课件',meta:'表面积'},
  '因数和倍数':{href:withHash('modules/09-factors/9-1-factors-multiples.html','因数和倍数'),label:'进入因数课件',meta:'整除关系'},
  '质数与合数':{href:withHash('modules/09-factors/9-2-prime-composite.html','质数与合数'),label:'进入质数课件',meta:'数字原子'},
  '小数的意义':{href:withHash('modules/04-place-value/4-2-dec-meaning.html','小数的意义'),label:'进入小数意义课件',meta:'位置值延伸'},
  '真分数和假分数':{href:withHash('modules/14-fraction-meaning/14-4-proper-improper.html','真分数和假分数'),label:'进入真/假分数课件',meta:'真假分界'},
  '约分':{href:withHash('modules/09-factors/9-3-reduction.html','约分'),label:'进入约分课件',meta:'清扫公因数'},
  '通分':{href:withHash('modules/09-factors/9-4-common-denominator.html','通分'),label:'进入通分课件',meta:'统一单位'},
  '分数加减法':{href:withHash('modules/10-fraction-ops/10-1-fraction-add-sub.html','分数加减法'),label:'进入分数加减课件',meta:'同单位相加'},
  '长方体体积':{href:withHash('modules/07-volume/7-3-volume-formula.html','长方体体积'),label:'进入体积公式课件',meta:'底面积×高'},
  '循环小数':{href:withHash('modules/02-dec-division/2-2-recurring-decimals.html','循环小数'),label:'进入循环小数课件',meta:'除不尽'},
  '整数加减法':{href:withHash('modules/03-integer-ops/3-1-add-sub.html','整数加减法'),label:'进入加减法课件',meta:'同单位计数'},
  '整数四则运算':{href:withHash('modules/03-integer-ops/3-2-four-operations.html','整数四则运算'),label:'进入四则运算课件',meta:'运算顺序'},
  '单位换算':{href:withHash('modules/04-place-value/4-3-unit-conversion.html','单位换算'),label:'进入单位换算课件',meta:'单位阶梯'},
  '等式的性质':{href:withHash('modules/05-equations/5-2-equality-properties.html','等式的性质'),label:'进入等式性质课件',meta:'天平法则'},
  '图形认知':{href:withHash('modules/08-geometry-intro/8-1-shape-cognition.html','图形认知'),label:'进入图形课件',meta:'边和角'},
  '观察物体':{href:withHash('modules/08-geometry-intro/8-2-observe-objects.html','观察物体'),label:'进入观察物体课件',meta:'三视图'},
  '轴对称与旋转':{href:withHash('modules/08-geometry-intro/8-3-symmetry.html','轴对称与旋转'),label:'进入对称旋转课件',meta:'图形变换'},
  '数据收集':{href:withHash('modules/11-statistics/11-1-data-collection.html','数据收集'),label:'进入数据收集课件',meta:'整理数据'},
  '折线统计图':{href:withHash('modules/11-statistics/11-2-line-chart.html','折线统计图'),label:'进入折线图课件',meta:'趋势山脊'},
  '可能性':{href:withHash('modules/11-statistics/11-3-probability.html','可能性'),label:'进入可能性课件',meta:'机会区域'},
  '容积和容积单位':{href:withHash('modules/07-volume/7-4-capacity.html','容积和容积单位'),label:'进入容积课件',meta:'内部空间'},
  '分数与小数互化':{href:withHash('modules/10-fraction-ops/10-2-fraction-decimal.html','分数与小数互化'),label:'进入互化课件',meta:'双语数字'},
  '235的倍数特征':{href:withHash('modules/09-factors/9-5-divisibility.html','235的倍数特征'),label:'进入倍数特征课件',meta:'倍数筛子'},
  '植树问题':{href:withHash('modules/12-applications/12-1-tree-planting.html','植树问题'),label:'进入植树问题课件',meta:'间隔端点'},
  '找次品':{href:withHash('modules/12-applications/12-2-find-faulty.html','找次品'),label:'进入找次品课件',meta:'三等分策略'}
};

const conceptNames = Array.from(new Set([
  ...Object.keys(visualByConcept),
  ...Object.keys(imageByConcept),
  ...Object.keys(lessonByConcept)
]));

const all = Object.fromEntries(conceptNames.map(name=>{
  const visual = visualByConcept[name] || ['✨','把抽象概念变成一个可观察的数学物件','可视化模型'];
  return [name,{
    name,
    icon:visual[0],
    metaphor:visual[1],
    label:visual[2],
    image:imageByConcept[name] || '',
    lesson:lessonByConcept[name] || null
  }];
}));

function get(name){
  return all[name] || null;
}

function assetUrl(path,rootPrefix){
  if(!path)return '';
  if(/^(?:https?:)?\/\//.test(path) || path.startsWith('/') || path.startsWith('data:'))return path;
  return `${rootPrefix || ''}${path.replace(/^\.\//,'')}`;
}

const root = typeof window !== 'undefined' ? window : globalThis;
root.MathGrade5Concepts = {
  all,
  images:imageByConcept,
  visuals:visualByConcept,
  lessons:lessonByConcept,
  get,
  assetUrl
};
})();
