package org.example.soundwavebackend.catalog.specification;

import jakarta.persistence.criteria.Predicate;
import org.example.soundwavebackend.catalog.entity.Track;
import org.example.soundwavebackend.catalog.entity.TrackPublicationStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class TrackSpecification {

    public static Specification<Track> filterCatalog(
            TrackPublicationStatus status,
            String genreSlug,
            String keyword
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("publicationStatus"), status));
            }

            if (genreSlug != null && !genreSlug.isBlank() && !"all".equalsIgnoreCase(genreSlug.trim())) {
                String cleanGenre = genreSlug.trim().toLowerCase();
                predicates.add(cb.equal(cb.lower(root.get("genre").get("slug")), cleanGenre));
            }

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                Predicate slugLike = cb.like(cb.lower(root.get("slug")), pattern);
                predicates.add(cb.or(titleLike, descLike, slugLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
