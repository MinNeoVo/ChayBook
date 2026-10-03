package com.chaybook.backend.allergy.service;

import com.chaybook.backend.allergy.entity.Allergy;
import com.chaybook.backend.allergy.repository.AllergyRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AllergyServiceTest {
    private static final Integer USER_ID = 42;

    @Mock private AllergyRepository allergyRepository;
    @Mock private UserRepository userRepository;
    @Mock private Allergy peanut;
    @Mock private Allergy soy;
    @Mock private User user;

    private AllergyService service;

    @BeforeEach
    void setUp() {
        service = new AllergyService(allergyRepository, userRepository);
    }

    @Test
    void getAllAllergiesReturnsOnlySortedAllergyFields() {
        when(peanut.getAllergyId()).thenReturn(1);
        when(peanut.getName()).thenReturn("Dau phong");
        when(soy.getAllergyId()).thenReturn(2);
        when(soy.getName()).thenReturn("Dau nanh");
        when(allergyRepository.findAll(Sort.by(Sort.Direction.ASC, "allergyId")))
                .thenReturn(List.of(peanut, soy));

        var response = service.getAllAllergies();

        assertEquals(2, response.size());
        assertEquals(1, response.get(0).allergyId());
        assertEquals("Dau phong", response.get(0).name());
        assertEquals(2, response.get(1).allergyId());
        assertEquals("Dau nanh", response.get(1).name());
    }

    @Test
    void getUserAllergiesReturnsEmptyListWhenUserHasNone() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(user.getAllergies()).thenReturn(Set.of());

        assertEquals(List.of(), service.getUserAllergies(USER_ID));
    }

    @Test
    void replaceUserAllergiesDeduplicatesIdsAndPersistsExactlySelectedRelations() {
        when(peanut.getAllergyId()).thenReturn(1);
        when(peanut.getName()).thenReturn("Dau phong");
        when(soy.getAllergyId()).thenReturn(2);
        when(soy.getName()).thenReturn("Dau nanh");
        when(allergyRepository.findAllById(any())).thenReturn(List.of(peanut, soy));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.saveAndFlush(user)).thenReturn(user);

        var response = service.replaceUserAllergies(USER_ID, List.of(1, 1, 2));

        assertEquals(List.of(1, 2), response.stream().map(item -> item.allergyId()).toList());
        verify(allergyRepository).findAllById(new LinkedHashSet<>(List.of(1, 2)));
        ArgumentCaptor<Set<Allergy>> allergiesCaptor = ArgumentCaptor.forClass(Set.class);
        verify(user).setAllergies(allergiesCaptor.capture());
        assertEquals(Set.of(peanut, soy), allergiesCaptor.getValue());
        verify(userRepository).saveAndFlush(user);
    }

    @Test
    void replaceUserAllergiesWithEmptyListClearsRelations() {
        when(allergyRepository.findAllById(any())).thenReturn(List.of());
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.saveAndFlush(user)).thenReturn(user);

        assertEquals(List.of(), service.replaceUserAllergies(USER_ID, List.of()));

        verify(user).setAllergies(Set.of());
        verify(userRepository).saveAndFlush(user);
    }

    @Test
    void unknownAllergyIdFailsBeforeChangingUserRelations() {
        when(peanut.getAllergyId()).thenReturn(1);
        when(allergyRepository.findAllById(any())).thenReturn(List.of(peanut));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.replaceUserAllergies(USER_ID, List.of(1, 9999))
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Unknown allergy IDs: [9999]", exception.getReason());
        verify(userRepository, never()).findById(any());
        verify(user, never()).setAllergies(any());
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void getAllergiesReturnsNotFoundForMissingUser() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.getUserAllergies(USER_ID)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }
}
