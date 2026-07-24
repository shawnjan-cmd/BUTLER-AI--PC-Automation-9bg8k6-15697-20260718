/**
 * ChatBubble — styled message bubble for Butler AI chat.
 * Matches Section 19.5 spec for user/butler bubble styling.
 *
 * User bubble:  right-aligned, ice-blue tint, bottom-right flat corner
 * Butler bubble: left-aligned, violet accent, small robot icon, left rail
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';
import ButlerLogo from '@/components/ButlerLogo';

const C = {
  card:     '#131924',
  primary:  '#6EE7FF',
  secondary:'#A78BFA',
  text:     '#E4EBF5',
  textMid:  '#7A8FA5',
};

export interface ChatBubbleProps {
  role:      'user' | 'assistant';
  content:   string;
  timestamp?: string;
  isStreaming?: boolean;
}

export const ChatBubble = memo(function ChatBubble({
  role,
  content,
  timestamp,
  isStreaming = false,
}: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <View style={s.userWrap}>
        <View style={s.userBubble}>
          <Text style={s.userText}>{content}</Text>
          {timestamp && <Text style={s.ts}>{timestamp}</Text>}
        </View>
      </View>
    );
  }

  // Butler bubble
  return (
    <View style={s.butlerWrap}>
      {/* Small robot icon */}
      <View style={s.avatarBox}>
        <MaterialCommunityIcons name="robot-happy-outline" size={18} color={C.secondary} />
      </View>
      <View style={{ flex: 1, maxWidth: '85%' }}>
        <View style={s.butlerBubble}>
          {/* Left violet rail */}
          <View style={s.butlerRail} />
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={s.butlerText}>{content}</Text>
            {isStreaming && (
              <Text style={[s.butlerText, { color: C.secondary }]}>▌</Text>
            )}
            {timestamp && <Text style={[s.ts, { textAlign: 'left', marginTop: 4 }]}>{timestamp}</Text>}
          </View>
        </View>
      </View>
    </View>
  );
});

const BODY = FontFamily.body as any;
const MONO = FontFamily.mono as any;

const s = StyleSheet.create({
  userWrap: {
    alignItems:   'flex-end',
    paddingHorizontal: 14,
    paddingVertical:    5,
  },
  userBubble: {
    maxWidth:        '80%',
    backgroundColor: C.primary + '15',
    borderRadius:    14,
    borderBottomRightRadius: 4,
    borderWidth:     1,
    borderColor:     C.primary + '40',
    padding:         12,
  },
  userText: {
    fontFamily:    BODY,
    fontSize:       14,
    color:          C.text,
    lineHeight:     21,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  butlerWrap: {
    flexDirection:    'row',
    alignItems:       'flex-end',
    gap:               8,
    paddingHorizontal: 14,
    paddingVertical:    5,
  },
  avatarBox: {
    width:           30,
    height:          30,
    borderRadius:     9,
    backgroundColor:  C.secondary + '14',
    borderWidth:      1,
    borderColor:      C.secondary + '40',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:       0,
  },
  butlerBubble: {
    flexDirection:   'row',
    backgroundColor: C.card,
    borderRadius:    14,
    borderBottomLeftRadius: 4,
    borderWidth:     1,
    borderColor:     C.secondary + '30',
    overflow:       'hidden',
    padding:         12,
    paddingLeft:      0,
  },
  butlerRail: {
    width:        2.5,
    alignSelf:   'stretch',
    backgroundColor: C.secondary,
    flexShrink:   0,
  },
  butlerText: {
    fontFamily:    BODY,
    fontSize:       14,
    color:          C.text,
    lineHeight:     21,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  ts: {
    fontFamily:    MONO,
    fontSize:       9,
    color:          C.textMid,
    marginTop:      3,
    textAlign:     'right',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});

export default ChatBubble;
