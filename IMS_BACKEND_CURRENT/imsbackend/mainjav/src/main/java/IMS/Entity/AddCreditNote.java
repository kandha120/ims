package IMS.Entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "credit_note")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddCreditNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String creditNoteNumber;

    private String date;

    private String customer;

    private String originalPoNumber;

    private String originalInvoiceDate;

    @Column(length = 1000)
    private String reasonForIssue;

    private Double totalAmount;

    private Double gst;

    private Double totalCredit;

    private String authorisedSignatory;

    private String status;

    @Column(length = 1000)
    private String remarks;

    @OneToMany(mappedBy = "creditNote", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<CreditNoteItem> items = new ArrayList<>();
}
