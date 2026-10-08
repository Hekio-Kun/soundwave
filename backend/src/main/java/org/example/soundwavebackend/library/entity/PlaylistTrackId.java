package org.example.soundwavebackend.library.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PlaylistTrackId implements Serializable {
    private Long playlistId;
    private Long trackId;
}
