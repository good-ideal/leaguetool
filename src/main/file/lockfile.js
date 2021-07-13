const fs = require('fs')
const childProcess = require('child_process')
const exec = childProcess.exec

//注册表
const registryPath = "HKEY_CURRENT_USER\\SOFTWARE\\Tencent\\LOL"
const registryPathKey = "InstallPath"
const registryREG_SZ = "REG_SZ"
const command = `reg query ${registryPath} /v ${registryPathKey}`
const leagueClient = "LeagueClient.exe"
const lockfile = "/LeagueClient/lockfile"

//"reg query HKEY_CURRENT_USER\\SOFTWARE\\Tencent\\LOL /v InstallPath"
//获取客户端路径
function viewRegistryMessage (command, cb) {

  exec(command, function (err, stdout, stderr) {
        if (err) {
          return console.error(err)
        }
        leagueClientPath = stdout.split(/\s+/g).filter((line) => {
            return line && ![ registryPath , registryPathKey , registryREG_SZ].includes(line);
        }).join()
        cb(leagueClientPath)
    })

}

//判断进程是否在线
function onlineLeagueClient(){
    let cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux'
    return new Promise((resolve, reject) => {
        exec(cmd, function (err, stdout, stderr) {
            if (err) {
              return console.error(err)
            }
            stdout.split('\n').filter((line) => {
              let processMessage = line.trim().split(/\s+/)
              let processName = processMessage[0] 
              if (processName === leagueClient) {
                resolve(true)
              }
            })
            reject(false)
          })
    })
}

function fileRead(installPath){
    lockfilePath = installPath + lockfile
    let data = null
    try {
        data = fs.readFileSync(lockfilePath, 'utf-8')
      } catch(e) {
        console.error('读取文件发生错误')
      }
    return data
}

//开始扫描
function startScanning(){
    let data
    onlineLeagueClient().then(() => {
        viewRegistryMessage(command,( leagueClientPath ) => {
            console.log('获取到客户端路径：', leagueClientPath)
            authString = fileRead(leagueClientPath)
            if(!authString){
                data.msg = '读取文件失败，可能是未启动客户端'
                console.log(data.msg)
            }else{
                //以冒号分开，分别是:进程名,PID,端口号,token,协议
                //参数放在内存中
                let agres = authString.split(':')
                if(agres.length >= 4){
                    //触发给主线程事件
                    data = { port : agres[2], token : agres[3], protocol : agres[4]}
                    // console.log(data)
                }
            }
        })
    }).catch(() => {
        data.msg = "请先打开LOL客户端"
        console.error(data.msg)
    })
    return data;
}

module.exports = { startScanning }


