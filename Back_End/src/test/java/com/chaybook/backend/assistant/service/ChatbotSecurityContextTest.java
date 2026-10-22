package com.chaybook.backend.assistant.service;

import com.chaybook.backend.assistant.client.GeminiClient;
import com.chaybook.backend.assistant.dto.ChatMessageRequest;
import com.chaybook.backend.assistant.entity.*;
import com.chaybook.backend.assistant.repository.*;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatbotSecurityContextTest {
    private final ChatbotService service=new ChatbotService();
    private final AiConversationRepository conversations=mock(AiConversationRepository.class);
    private final AiMessageRepository messages=mock(AiMessageRepository.class);
    private final GeminiClient provider=mock(GeminiClient.class);
    private final GuestTrialLimiter limiter=new GuestTrialLimiter();
    private final AiConversation conversation=new AiConversation();
    private final ChatMessageRequest request=new ChatMessageRequest();
    @BeforeEach void setup() {
        ReflectionTestUtils.setField(service,"geminiClient",provider);
        ReflectionTestUtils.setField(service,"trialLimiter",limiter);
        ReflectionTestUtils.setField(service,"conversationRepository",conversations);
        ReflectionTestUtils.setField(service,"messageRepository",messages);
        ReflectionTestUtils.setField(service,"recipeRepository",mock(RecipeRepository.class));
        ReflectionTestUtils.setField(service,"userRepository",mock(UserRepository.class));
        ReflectionTestUtils.setField(conversation,"conversationId",1);
        request.setConversationId(1); request.setMessage("How much protein?");
        when(conversations.findById(1)).thenReturn(Optional.of(conversation));
        when(messages.findTop12ByConversationConversationIdOrderByMessageIdDesc(1)).thenReturn(List.of());
        when(messages.save(any())).thenAnswer(call->call.getArgument(0));
        when(provider.generateContent(anyString())).thenReturn("Synthetic answer");
    }
    @Test void anotherGuestCannotUseConversationIdOrClaimLegacyHistory() {
        conversation.setGuestKey("guest-a");
        assertThrows(ResponseStatusException.class,()->service.sendMessage(null,"guest-b",request));
        conversation.setGuestKey(null);
        assertThrows(ResponseStatusException.class,()->service.sendMessage(null,"guest-a",request));
        verifyNoInteractions(provider); verify(messages,never()).save(any());
    }
    @Test void authenticatedUserCannotAccessOtherUserOrGuest() {
        User owner=new User(); ReflectionTestUtils.setField(owner,"userId",3); conversation.setUser(owner);
        assertThrows(ResponseStatusException.class,()->service.sendMessage(2,"guest-a",request));
        conversation.setUser(null); conversation.setGuestKey("guest-a");
        assertThrows(ResponseStatusException.class,()->service.sendMessage(2,"guest-a",request));
        verifyNoInteractions(provider);
    }
    @Test void ownerReceivesRecentChronologicalContext() {
        conversation.setGuestKey("guest-a");
        AiMessage older=new AiMessage(); older.setSender("USER"); older.setMessage("I avoid peanuts");
        AiMessage newer=new AiMessage(); newer.setSender("AI"); newer.setMessage("Understood");
        when(messages.findTop12ByConversationConversationIdOrderByMessageIdDesc(1)).thenReturn(List.of(newer,older));
        service.sendMessage(null,"guest-a",request);
        var prompt=org.mockito.ArgumentCaptor.forClass(String.class); verify(provider).generateContent(prompt.capture());
        assertTrue(prompt.getValue().contains("I avoid peanuts"));
        assertTrue(prompt.getValue().indexOf("I avoid peanuts")<prompt.getValue().indexOf("Understood"));
        assertTrue(prompt.getValue().contains("How much protein?"));
    }
    @Test void providerFailureReleasesGuestQuota() {
        conversation.setGuestKey("guest-a");
        when(provider.generateContent(anyString())).thenThrow(new IllegalStateException("Synthetic outage"));
        assertThrows(IllegalStateException.class,()->service.sendMessage(null,"guest-a",request));
        assertEquals(3,limiter.getRemaining("guest-a"));
    }
    @Test void oversizedOrBlankMessagesNeverReachProvider() {
        for(String value:List.of(" ","x".repeat(4001))) {
            request.setMessage(value); assertThrows(ResponseStatusException.class,()->service.sendMessage(null,"guest-a",request));
        }
        verifyNoInteractions(provider,conversations,messages);
    }
    @Test void historyBudgetDropsOversizedOldContext() {
        conversation.setGuestKey("guest-a");
        AiMessage huge=new AiMessage(); huge.setSender("AI"); huge.setMessage("x".repeat(13000));
        when(messages.findTop12ByConversationConversationIdOrderByMessageIdDesc(1)).thenReturn(List.of(huge));
        service.sendMessage(null,"guest-a",request);
        verify(provider).generateContent(argThat(prompt->prompt.length()<16000));
    }
}
