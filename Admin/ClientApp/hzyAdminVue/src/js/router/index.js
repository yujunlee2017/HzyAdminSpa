import Vue from 'vue'
import VueRouter from 'vue-router'
//
import { Loading } from 'element-ui';
//
import Main from '../../views/Main';
import Login from '../../views/Login';
import CCT from '../../views/CCT/Index';

//
Vue.use(VueRouter);
//检查权限
var checkRouter = function(to, next) {
    //判断是否需要权限判断
    var _title = to['meta']['title'];
    if (!_title) return next();
    //判断权限
    var _menuId = to['meta']['menuId'];
    var _powerState = global.$store.state.app.powerAll.find(w => w.MenuID == _menuId);
    if (!_powerState || !_powerState.Have) {
        global.tools.msg('权限不足!', '错误');
        return next({ path: "/Login" });
    }
    //添加选项卡
    global.$store.commit('app/addOrCheckedTab', {
        title: to['meta']['title'],
        name: to.name,
        active: true
    });
    global.$power = _powerState;
    return next();
};

// const routers = [{
//         path: '/',
//         component: Main,
//         children: [{
//             path: '/Home',
//             name: "/Home",
//             component: Home,
//             meta: { title: '首页' },
//         }, {
//             path: '/Sys/User',
//             name: '/Sys/User',
//             component: User,
//             meta: { title: '用户管理1' },
//         }, {
//             path: '/Sys/Role',
//             name: '/Sys/Role',
//             component: Role,
//             meta: { title: '角色管理' },
//         }]
//     },
//     { path: '/Login', name: '/Login', component: Login },
//     { path: '*', redirect: "/Home" }
// ];

const vueRouter = new VueRouter({
    mode: 'history',
    routes: [
        { path: '/Login', name: '/Login', component: Login },
        { path: '/CCT', name: 'CCT', component: CCT },
    ]
});

let _loading = null;
//路由拦截器
vueRouter.beforeEach((to, from, next) => {
    //console.log('路由拦截器 from=', from, 'to=', to);

    if (to.path == '/Login') return next();

    //检查是否登录授权
    if (!global.tools.getCookie('Authorization')) return next({ path: "/Login" });

    _loading = Loading.service({
        lock: true,
        background: 'rgba(0, 0, 0, 0.1)'
    });

    //获取后台菜单数据 然后动态添加路由
    if (global.$store.state.app.menus.length == 0) {
        global.$store.dispatch('app/getMenus', (data) => {
            var _allList = data.allList;
            // var _list = data.list;
            //路由组装
            var _children = [];
            for (var i = 0; i < _allList.length; i++) {
                var _menu = _allList[i];
                if (!_menu.Menu_Url) continue;
                var _item = _children.find(w => w.path == _menu.Menu_Url);
                if (_item) continue;
                _children.push({
                    path: _menu.Menu_Url,
                    name: _menu.Menu_Url,
                    component: loadViews(_menu.Menu_Url),
                    meta: { title: _menu.Menu_Name, menuId: _menu.Menu_ID },
                });
            }
            //
            var _router = [{
                    path: '/',
                    component: Main,
                    children: _children,
                    redirect: "/Home"
                },
                { path: '*', redirect: "/Login" }
            ];

            // console.log(vueRouter);
            vueRouter.addRoutes(_router);
            // console.log('vueRouter.options.routes', vueRouter.options.routes);
            global.$store.commit('app/setRouterConfig', vueRouter.options.routes);
            //刚 add 完路由 需要手动告诉 next 跳转哪里 所以需要 将 to 传递过去不然容易出现bug
            return next(to);
        });
        return;
    }
    return checkRouter(to, next);
});
vueRouter.afterEach(() => {
    if (_loading) _loading.close();
});

//动态获取 组件
function loadViews(path) {
    return () =>
        import (`@/views${path}.vue`);
}

export default vueRouter;