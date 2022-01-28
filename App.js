import React, { Component } from 'react';
import { View, Text,Platform,ScrollView,TouchableOpacity, SafeAreaView } from 'react-native';
import RtcEngine,{RtcLocalView,RtcRemoteView,VideoRenderMode,ClientRole,ChannelProfile} from 'react-native-agora';
import requestCameraAndAudioPermission from './components/Permission';
import styles from './components/Styles';
const token="006ad62bdbcdede44308f3f5c9ebae6e962IADF6fER3F4bCasSOWs1ZHXUzv3Qlgzt61CajMF+7Nm7fgJkFYoAAAAAEAD1z9KP1uHzYQEAAQDX4fNh";
const appId="ad62bdbcdede44308f3f5c9ebae6e962";
const channelName='channel-x';

export default class App extends Component {
  _engine;
  constructor(props) {
    super(props);
    this.state = {
      isHost:true,
      joinSuceed:false,
      peerIds:[],
    };
    if(Platform.OS='android'){
      requestCameraAndAudioPermission().then(()=>{
        console.log('requested');
      });
    }
  }
  componentDidMount(){
    this.init();
  }
  componentWillUnmount(){
    this._engine?.destroy()
  }
  init=async()=>{
    this._engine=await RtcEngine.create(appId);
    await this._engine.enableVideo();
    await this._engine?.setChannelProfile(ChannelProfile.LiveBroadcasting);
    await this._engine?.setClientRole(
      this.state.isHost ?ClientRole.Broadcaster:ClientRole.Audience
    );
    this._engine.addListener('Warning',(warn)=>{
      console.log('Warning',warn);
    })
    this._engine.addListener('Error',(err)=>{
      console.log('Error',err);
    })
    this._engine.addListener('UserJoined',(uid,elapsed)=>{
      console.log('UserJoined',uid,elapsed)
      const {peerIds}=this.state;
      if(peerIds.indexOf(uid)===-1){
        this.setState({
          peerIds:[...peerIds,uid]
        })
      }
    })
    this._engine.addListener('UserOffline',(uid,reason)=>{
      console.log('UserOfLine',uid,reason);
      const {peerIds}=this.state;
      this.setState({
        peerIds:peerIds.filter((id)=>id!==uid)
      })
    })
    this._engine.addListener('JoinChannelSuccess',(channel,uid,elapsed)=>{
      console.log('JoinChannelSuccess',channel,uid,elapsed);
      this.setState({
        joinSuceed:true
      })
    })
  }
  startCall=async()=>{
    await this._engine?.joinChannel(token,channelName,null,0);
  }
  endCall=async()=>{
    await this._engine?.leaveChannel();
    this.setState({peerIds:[],joinSuceed:false})
  }
  toggleRoll=async()=>{
    this.setState({isHost:!this.state.isHost},async()=>{
      await this._engine?.setClientRole(
        this.state.isHost?ClientRole.Broadcaster:ClientRole.Audience,
      )
    })
    
  }
  render() {
    return (
      <SafeAreaView style={styles.max}>
        <View style={styles.max}>
        <Text style={styles.roleText}> Your're {this.state.isHost?'a broadcaster':'the audience'} </Text>
        <View style={styles.buttonHolder}>
        <TouchableOpacity onPress={this.toggleRoll} style={styles.button}>
            <Text style={styles.buttonText}>Toggle Role</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.startCall} style={styles.button}>
            <Text style={styles.buttonText}>Start Call</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.endCall} style={styles.button}>
            <Text style={styles.buttonText}>End Call</Text>
          </TouchableOpacity>
        </View>
        {this._renderVideos()}
        </View>
      </SafeAreaView>
    );
  }
  _renderVideos=()=>{
    const {joinSuceed}= this.state;
    return joinSuceed ?(
      <View style={styles.fullView}>
        {this.state.isHost?(
          <RtcLocalView.SurfaceView 
          style={styles.max} 
          channelId={channelName} 
          renderMode={VideoRenderMode.Hidden}/>
        ):(<></>)}
        {this._renderRemoteVideos()}
      </View>
    ):null
  }

  _renderRemoteVideos=()=>{
    const {peerIds} =this.state
    return(
      <ScrollView style={styles.remoteContainer}
      contentContainerStyle={styles.remoteContainerContent}
      horizontal={true}>
        {peerIds.map((value)=>{
          return(
            <RtcRemoteView.SurfaceView
            style={styles.remote}
            uid={value}
            channelId={channelName}
            renderMode={VideoRenderMode.Hidden}
            zOrderMediaOverlay={true}/>
          );
        })}
      </ScrollView>
    )
  }

}
