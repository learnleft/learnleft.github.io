module.exports = {
        sidebar: {//左侧列表
            '/guide/vue/': [
                'test01', 'test02', 'test03'
            ],
            '/guide/ts/': [
                {
                    title: 'Typescript 学习',
                    collapsable: true,
                    children: ['test01', 'test02', 'test03']
                }
            ],            
            '/': [''] //不能放在数组第一个，否则会导致右侧栏无法使用 
        }
...
}
