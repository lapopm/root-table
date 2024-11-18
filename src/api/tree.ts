// api/tree.js
import axios from 'axios'

export const getFirstLevel = async (params: any) => {
    // 实际的API请求
    return await axios({
        url: '/api/department',
        method: 'get',
        params
    })
}

export const getSecondLevel = async (params: any) => {
    return await axios({
        url: '/api/team',
        method: 'get',
        params
    })
}

export const getThirdLevel = async (params: any) => {
    return await axios({
        url: '/api/member',
        method: 'get',
        params
    })
}